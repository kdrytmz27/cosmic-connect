import { logger } from '../utils/logger';
import { UserRole } from '../enums/UserRole';

// FEAT-05: Zodiac compatibility scoring for matchmaking
const FIRE = ['Aries', 'Leo', 'Sagittarius', 'Koç', 'Aslan', 'Yay'];
const EARTH = ['Taurus', 'Virgo', 'Capricorn', 'Boğa', 'Başak', 'Oğlak'];
const AIR = ['Gemini', 'Libra', 'Aquarius', 'İkizler', 'Terazi', 'Kova'];
const WATER = ['Cancer', 'Scorpio', 'Pisces', 'Yengeç', 'Akrep', 'Balık'];

function getElement(sign: string | null | undefined): string | null {
    if (!sign) return null;
    const lowerSign = sign.toLowerCase();

    // VULN 46 FIX: Zodiac Case Sensitivity (Case-Insensitive matching)
    if (FIRE.some(s => s.toLowerCase() === lowerSign)) return 'FIRE';
    if (EARTH.some(s => s.toLowerCase() === lowerSign)) return 'EARTH';
    if (AIR.some(s => s.toLowerCase() === lowerSign)) return 'AIR';
    if (WATER.some(s => s.toLowerCase() === lowerSign)) return 'WATER';
    return null;
}

// Returns 0 (neutral), 20 (compatible), or 30 (highly compatible) bonus points
function getZodiacCompatBonus(sign1: string | null | undefined, sign2: string | null | undefined): number {
    const e1 = getElement(sign1);
    const e2 = getElement(sign2);
    if (!e1 || !e2) return 0;
    if (e1 === e2) return 20; // Same element: very compatible
    // Fire <-> Air and Water <-> Earth are complementary
    if ((e1 === 'FIRE' && e2 === 'AIR') || (e1 === 'AIR' && e2 === 'FIRE')) return 30;
    if ((e1 === 'WATER' && e2 === 'EARTH') || (e1 === 'EARTH' && e2 === 'WATER')) return 30;
    return 0; // Incompatible: neutral, use default threshold
}

export interface QueuedPlayer {
    userId: string;
    socketId: string;
    matchScore: number;
    isPremium: boolean;
    karma: number;
    sunSign: string | null;
}

const queue: QueuedPlayer[] = [];
const rooms = new Map<string, any>();

export const matchmakingService = {
    async joinQueue(player: QueuedPlayer) {
        // Remove existing entry for this user (prevent duplicates)
        const existingIdx = queue.findIndex(p => p.userId === player.userId);
        if (existingIdx !== -1) {
            queue.splice(existingIdx, 1);
        }

        // Additional safety check: Ensure user is not a teller
        const { prisma } = await import('../index');
        const user = await prisma.user.findUnique({ where: { id: player.userId } });
        if (user?.role === UserRole.FORTUNE_TELLER) {
            logger.debug(`[Matchmaking] User ${player.userId} is a teller. Rejecting queue entry.`);
            return;
        }

        queue.push(player);
        logger.debug(`[Matchmaking] User ${player.userId} joined queue. Queue size: ${queue.length}`);
    },

    removeFromQueue(userId: string) {
        const idx = queue.findIndex(p => p.userId === userId);
        if (idx !== -1) {
            queue.splice(idx, 1);
            logger.debug(`[Matchmaking] User ${userId} removed from queue. Queue size: ${queue.length}`);
        }
    },

    async tryMatch(): Promise<[QueuedPlayer, QueuedPlayer][]> {
        logger.debug(`[Matchmaking] tryMatch called. Queue size: ${queue.length}`, { queue: queue.map(p => ({ userId: p.userId, score: p.matchScore })) });
        const matchedPairs: [QueuedPlayer, QueuedPlayer][] = [];

        if (queue.length >= 2) {
            const { prisma } = await import('../index');
            let i = 0;
            while (i < queue.length) {
                let matched = false;
                for (let j = i + 1; j < queue.length; j++) {
                    const p1 = queue[i];
                    const p2 = queue[j];
                    if (!p1 || !p2) continue;

                    const scoreDiff = Math.abs(p1.matchScore - p2.matchScore);
                    const compatBonus = getZodiacCompatBonus(p1.sunSign, p2.sunSign);

                    const k1 = p1.karma ?? 100;
                    const k2 = p2.karma ?? 100;
                    let karmaBonus = 0;
                    if (k1 >= 120 && k2 >= 120) karmaBonus = 15;
                    else if (k1 < 50 || k2 < 50) karmaBonus = -10;

                    const effectiveThreshold = 20 + compatBonus + karmaBonus;

                    if (scoreDiff <= effectiveThreshold) {
                        const existingRelation = await prisma.friendship.findFirst({
                            where: {
                                OR: [
                                    { user1Id: p1.userId, user2Id: p2.userId },
                                    { user1Id: p2.userId, user2Id: p1.userId }
                                ]
                            }
                        });

                        if (existingRelation) {
                            continue;
                        }

                        matchedPairs.push([p1, p2]);
                        queue.splice(j, 1);
                        queue.splice(i, 1);
                        matched = true;
                        logger.info(`[Matchmaking] MATCH FOUND! ${p1.userId} <-> ${p2.userId} (compat bonus: ${compatBonus})`);
                        break;
                    }
                }
                if (!matched) {
                    i++;
                }
            }
        }
        return matchedPairs;
    },

    async createRoom(p1: QueuedPlayer, p2: QueuedPlayer, timeoutCallback: (roomId: string) => void): Promise<{ roomId: string, duration: number }> {
        const roomId = `room_${Date.now()}_${p1.userId}_${p2.userId}`;

        const isPremiumMatch = p1.isPremium || p2.isPremium;
        const duration = isPremiumMatch ? 320000 : 160000;
        const expiresAt = Date.now() + duration;
        const timeoutId = setTimeout(() => timeoutCallback(roomId), duration);

        rooms.set(`room:${roomId}`, {
            p1: p1.userId,
            p2: p2.userId,
            createdAt: Date.now(),
            expiresAt,
            timeoutId,
            extraTimeRequests: new Set<string>(),
            timeoutCallback
        });

        // VULN 35 FIX COMPATIBILITY: We must insert a temporary SWIPE_MATCH record so that
        // the "Force Match Protection" in friendship.service.ts acceptMatch doesn't block legitimate matchmaking socket matches!
        try {
            await prisma.friendship.create({
                data: {
                    user1Id: p1.userId,
                    user2Id: p2.userId,
                    status: 'SWIPE_MATCH' as any
                }
            });
        } catch (e) {
            // Might already exist due to quick re-queue, ignore
        }

        return { roomId, duration };
    },

    getRoom(roomId: string) {
        return rooms.get(`room:${roomId}`);
    },

    extendRoomTime(roomId: string, extraMs: number) {
        const room = rooms.get(`room:${roomId}`);
        if (!room) return false;

        const now = Date.now();
        const currentRemaining = Math.max(0, room.expiresAt - now);
        const newRemaining = currentRemaining + extraMs;
        room.expiresAt = now + newRemaining;

        clearTimeout(room.timeoutId);
        room.timeoutId = setTimeout(() => room.timeoutCallback(roomId), newRemaining);
        room.extraTimeRequests.clear();
        return true;
    },

    async removeRoom(roomId: string) {
        const room = rooms.get(`room:${roomId}`);
        if (room && room.timeoutId) clearTimeout(room.timeoutId);
        rooms.delete(`room:${roomId}`);

        try {
            const { getSocketIo } = await import('../controllers/socket.controller');
            const io = getSocketIo();
            if (io) {
                // Force user client to close chat UI
                io.to(roomId).emit('chatEnded', { message: 'Süre doldu, kozmik bağlantı koptu.' });
                // EVICT ALL: Prevent eavesdropping/hacked messages
                io.socketsLeave(roomId);
            }
        } catch (e) {
            logger.error(`[Socket] Error leaving room ${roomId}:`, e);
        }
    }
};
