import { logger } from '../utils/logger';
import { UserRole } from '../enums/UserRole';
import { prisma } from '../index';

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

export const matchmakingService = {
    async joinQueue(player: QueuedPlayer) {
        const { prisma } = await import('../index');
        const user = await prisma.user.findUnique({ where: { id: player.userId } });
        if (user?.role === UserRole.FORTUNE_TELLER) {
            logger.debug(`[Matchmaking] User ${player.userId} is a teller. Rejecting queue entry.`);
            return;
        }

        await prisma.matchQueue.upsert({
            where: { userId: player.userId },
            create: {
                userId: player.userId,
                socketId: player.socketId,
                matchScore: player.matchScore,
                isPremium: player.isPremium,
                karma: player.karma,
                sunSign: player.sunSign
            },
            update: {
                socketId: player.socketId,
                matchScore: player.matchScore,
                isPremium: player.isPremium,
                karma: player.karma,
                sunSign: player.sunSign,
                joinedAt: new Date()
            }
        });
        logger.debug(`[Matchmaking] User ${player.userId} joined queue in DB.`);
    },

    async removeFromQueue(userId: string) {
        const { prisma } = await import('../index');
        try {
            await prisma.matchQueue.delete({ where: { userId } });
            logger.debug(`[Matchmaking] User ${userId} removed from queue in DB.`);
        } catch (e) {
            // Already removed or not in queue
        }
    },

    async tryMatch(): Promise<[QueuedPlayer, QueuedPlayer][]> {
        const { prisma } = await import('../index');
        const queue = await prisma.matchQueue.findMany({ orderBy: { joinedAt: 'asc' } });
        logger.debug(`[Matchmaking] tryMatch called. Queue DB size: ${queue.length}`);
        
        const matchedPairs: [QueuedPlayer, QueuedPlayer][] = [];

        if (queue.length >= 2) {
            const queueIds = queue.map(q => q.userId);
            const allFriendships = await prisma.friendship.findMany({
                where: {
                    user1Id: { in: queueIds },
                    user2Id: { in: queueIds }
                }
            });
            const friendSet = new Set<string>();
            allFriendships.forEach(f => {
                friendSet.add(`${f.user1Id}_${f.user2Id}`);
                friendSet.add(`${f.user2Id}_${f.user1Id}`);
            });

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
                        if (friendSet.has(`${p1.userId}_${p2.userId}`)) {
                            continue;
                        }

                        // Try to lock/remove them atomically to prevent multi-instance race conditions
                        try {
                            await prisma.$transaction([
                                prisma.matchQueue.delete({ where: { userId: p1.userId } }),
                                prisma.matchQueue.delete({ where: { userId: p2.userId } })
                            ]);
                            
                            matchedPairs.push([p1, p2]);
                            queue.splice(j, 1);
                            queue.splice(i, 1);
                            matched = true;
                            logger.info(`[Matchmaking] MATCH FOUND! ${p1.userId} <-> ${p2.userId} (compat bonus: ${compatBonus})`);
                            break;
                        } catch (e) {
                            logger.debug(`[Matchmaking] DB Collision: Another instance likely matched ${p1.userId} or ${p2.userId}`);
                        }
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
        const { prisma } = await import('../index');
        const roomId = `room_${Date.now()}_${p1.userId}_${p2.userId}`;

        const isPremiumMatch = p1.isPremium || p2.isPremium;
        const duration = isPremiumMatch ? 320000 : 160000;
        const expiresAt = Date.now() + duration;

        await prisma.matchRoom.create({
            data: {
                id: roomId,
                p1Id: p1.userId,
                p2Id: p2.userId,
                expiresAt: new Date(expiresAt),
                extensionsCount: 0
            }
        });

        // Set local timeout. If the room is extended on another server, the timeout callback will check the DB before deleting.
        setTimeout(() => timeoutCallback(roomId), duration);

        try {
            await prisma.friendship.create({
                data: {
                    user1Id: p1.userId,
                    user2Id: p2.userId,
                    status: 'SWIPE_MATCH' as any
                }
            });
        } catch (e) {}

        return { roomId, duration };
    },

    async getRoom(roomId: string) {
        const { prisma } = await import('../index');
        return prisma.matchRoom.findUnique({ where: { id: roomId } });
    },

    async extendRoomTime(roomId: string, extraMs: number) {
        const { prisma } = await import('../index');
        const room = await prisma.matchRoom.findUnique({ where: { id: roomId } });
        if (!room) return false;

        const now = Date.now();
        const currentRemaining = Math.max(0, room.expiresAt.getTime() - now);
        const newRemaining = currentRemaining + extraMs;

        await prisma.matchRoom.update({
            where: { id: roomId },
            data: { 
                expiresAt: new Date(now + newRemaining),
                extensionsCount: room.extensionsCount + 1
            }
        });

        return true;
    },

    async removeRoom(roomId: string) {
        const { prisma } = await import('../index');
        const room = await prisma.matchRoom.findUnique({ where: { id: roomId } });
        if (!room) return;

        // Check if room was extended (perhaps by another server instance)
        if (room.expiresAt.getTime() > Date.now()) {
            const remaining = room.expiresAt.getTime() - Date.now();
            setTimeout(() => matchmakingService.removeRoom(roomId), remaining);
            return;
        }

        try {
            await prisma.matchRoom.delete({ where: { id: roomId } });
            
            const { getSocketIo } = await import('../controllers/socket.controller');
            const io = getSocketIo();
            if (io) {
                io.to(roomId).emit('chatEnded', { message: 'Süre doldu, kozmik bağlantı koptu.' });
                io.socketsLeave(roomId);
            }
        } catch (e) {
            logger.error(`[Socket] Error leaving room ${roomId}:`, e);
        }
    }
};
