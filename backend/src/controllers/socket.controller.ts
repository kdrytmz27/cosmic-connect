import { Server } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import { matchmakingService } from '../services/matchmaking.service';
import { slotManager } from '../services/slot.service';
import { partyManager } from '../services/partyManager.service';
import { prisma } from '../index';
import { logger } from '../utils/logger';
import { UserRole } from '../enums/UserRole';
import { PARTY_GIFTS } from '../config/gifts';

let _io: Server | null = null;
const disconnectTimeouts = new Map<string, NodeJS.Timeout>();

// Lucky Package Memory Store
interface LuckyPackage {
    id: string;
    roomId: string;
    senderId: string;
    senderName: string;
    totalAmount: number;
    remainingAmount: number;
    totalPieces: number;
    remainingPieces: number;
    claims: { userId: string; userName: string; amount: number }[];
    expiresAt: number;
}
const activeLuckyPackages = new Map<string, LuckyPackage>();

export function getSocketIo() {
    return _io;
}

async function canRelayTypingEvent(userId: string, otherUserId: string): Promise<boolean> {
    const friendship = await prisma.friendship.findFirst({
        where: {
            OR: [
                { user1Id: userId, user2Id: otherUserId },
                { user1Id: otherUserId, user2Id: userId }
            ]
        }
    });
    if (!friendship) return false;

    const isBlocked = await prisma.blockedUser.findFirst({
        where: {
            OR: [
                { blockerId: userId, blockedId: otherUserId },
                { blockerId: otherUserId, blockedId: userId }
            ]
        }
    });
    return !isBlocked;
}

export function setupSocket(io: Server) {
    _io = io;
    // Middleware for Socket Authentication
    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return next(new Error('Invalid token'));
        }

        try {
            const dbUser = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { role: true } });
            if (!dbUser) {
                return next(new Error('User not found'));
            }
            if (dbUser.role === 'BANNED') {
                return next(new Error('Account is banned'));
            }
        } catch (e) {
            return next(new Error('Authentication error'));
        }

        (socket as any).userId = decoded.userId;
        next();
    });

    if (!slotManager.isInitialized) {
        slotManager.initialize(io);
    }
    partyManager.initialize(io);

    io.on('connection', (socket) => {
        const userId = (socket as any).userId;
        logger.debug(`Socket user connected: ${userId} - ${socket.id}`);

        // Eğer kullanıcının bekleyen bir kopma zamanlayıcısı varsa iptal et (30 saniye içinde geri döndü)
        if (disconnectTimeouts.has(userId)) {
            clearTimeout(disconnectTimeouts.get(userId)!);
            disconnectTimeouts.delete(userId);
        }

        // Set user as online
        prisma.user.update({
            where: { id: userId },
            data: { isOnline: true, lastSeen: null }
        }).then(() => {
            io.emit('userStatusChanged', { userId, isOnline: true, lastSeen: null });
        }).catch(err => logger.error(`Error updating online status for ${userId}:`, err));

        // User joins their personal room to receive private directed messages (like slot results)
        socket.join(userId);

        // Handle joining the Queue
        socket.on('joinMatchmaking', async () => {
            logger.debug(`[Socket] User ${userId} requesting matchmaking`);
            const user = await prisma.user.findUnique({ where: { id: userId } });

            if (user?.role === UserRole.FORTUNE_TELLER) {
                socket.emit('queueStatus', { status: 'error', message: 'Falcılar eşleşme kuyruğuna katılamaz.' });
                return;
            }

            await matchmakingService.joinQueue({ userId, socketId: socket.id, matchScore: user?.matchScore || 100, isPremium: user?.isPremium || false, karma: user?.karma ?? 100, sunSign: user?.sunSign || null });
            socket.emit('queueStatus', { status: 'searching' });

            // Try to match immediately after joining.
            // Queue Starvation patched: process all possible matches
            const matches = await matchmakingService.tryMatch();
            for (const match of matches) {
                const [p1, p2] = match;
                // Create room for initial socket communication (matchFound event)
                const { roomId, duration } = await matchmakingService.createRoom(p1, p2, (_rId: string) => {
                    matchmakingService.removeRoom(_rId);
                });

                const socket1 = io.sockets.sockets.get(p1.socketId);
                const socket2 = io.sockets.sockets.get(p2.socketId);

                if (socket1 && socket2) {
                    const u1 = await prisma.user.findUnique({ where: { id: p1.userId }, select: { id: true, name: true, email: true, avatar: true } });
                    const u2 = await prisma.user.findUnique({ where: { id: p2.userId }, select: { id: true, name: true, email: true, avatar: true } });

                    socket1.join(roomId);
                    socket2.join(roomId);
                    io.to(roomId).emit('matchFound', { 
                        roomId, 
                        expiresIn: duration / 1000, 
                        users: [p1.userId, p2.userId],
                        profiles: u1 && u2 ? {
                            [p1.userId]: u1,
                            [p2.userId]: u2
                        } : undefined
                    });
                }
            }
        });

        socket.on('leaveMatchmaking', () => {
            logger.debug(`[Socket] User ${userId} leaving matchmaking queue`);
            matchmakingService.removeFromQueue(userId);
        });

        socket.on('leaveRoom', (data: { roomId: string }) => {
            if (!socket.rooms.has(data.roomId)) return;
            socket.to(data.roomId).emit('partnerLeftRoom');
            matchmakingService.removeRoom(data.roomId);
        });

        // Handle typing events: roomId path for matchmaking rooms, receiverId path for DMs
        // (receiverId is gated by an existing friendship + not-blocked check to prevent Ghost Ping harassment)
        socket.on('typing', async (data: { roomId?: string, receiverId?: string }) => {
            if (data.roomId && socket.rooms.has(data.roomId)) {
                socket.to(data.roomId).emit('userTyping', { senderId: userId });
                return;
            }
            if (data.receiverId && await canRelayTypingEvent(userId, data.receiverId)) {
                io.to(data.receiverId).emit('userTyping', { senderId: userId });
            }
        });

        socket.on('stopTyping', async (data: { roomId?: string, receiverId?: string }) => {
            if (data.roomId && socket.rooms.has(data.roomId)) {
                socket.to(data.roomId).emit('userStoppedTyping', { senderId: userId });
                return;
            }
            if (data.receiverId && await canRelayTypingEvent(userId, data.receiverId)) {
                io.to(data.receiverId).emit('userStoppedTyping', { senderId: userId });
            }
        });

        // Removed insecure client-driven friend Request emits. 
        // They are now handled strictly via server-side REST API calls which verify friendships in the DB.

        socket.on('joinGroup', async (sign: string) => {
            if (!userId) return;
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { sunSign: true, role: true } });
            if (user?.role === UserRole.ADMIN || user?.sunSign === sign) {
                socket.join(`group_${sign}`);
            } else {
                socket.emit('queueStatus', { status: 'error', message: 'Bu burç grubuna katılma yetkiniz yok.' });
            }
        });

        socket.on('leaveGroup', (sign: string) => {
            socket.leave(`group_${sign}`);
        });

        // Track last group message time per user to prevent flooding
        const lastGroupMsgTime = new Map<string, number>();

        socket.on('sendGroupMessage', async (data: { sign: string, content: string }) => {
            if (!userId) return;

            // Content validation
            if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) return;
            if (data.content.length > 500) return; // Max message length

            // VULN 57 FIX: Group Message IDOR - Verify user is actually a member of this group room
            if (!socket.rooms.has(`group_${data.sign}`)) {
                socket.emit('queueStatus', { status: 'error', message: 'IDOR Koruması: Bu gruba üye değilsiniz, mesaj gönderemezsiniz.' });
                return;
            }

            // Flood protection: 1 message per second per user
            const now = Date.now();
            const lastTime = lastGroupMsgTime.get(userId) || 0;
            if (now - lastTime < 1000) return;
            lastGroupMsgTime.set(userId, now);

            const cleanContent = data.content.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");

            try {
                const msg = await prisma.groupMessage.create({
                    data: { roomId: data.sign, senderId: userId, content: cleanContent },
                    include: { sender: { select: { id: true, name: true, avatar: true, sunSign: true, cosmicStatus: true } } }
                });
                io.to(`group_${data.sign}`).emit('newGroupMessage', msg);
            } catch (e) {
                logger.error('Error sending group msg:', e);
            }
        });
        // ==== PARTY ROOM EVENTS (Professional Architecture) ====
        socket.on('joinPartyRoom', async (roomId: string, password?: string) => {
            if (!userId) return;

            try {
                const room = await prisma.partyRoom.findUnique({
                    where: { id: roomId },
                    include: { owner: { select: { name: true, avatar: true } } }
                });
                if (!room) {
                    socket.emit('partyError', { message: 'Oda bulunamadı veya kapatılmış.' });
                    return;
                }

                const state = partyManager.createRoomState(roomId, room.ownerId, room);

                if (state.bannedUsers.includes(userId)) {
                    socket.emit('partyError', { message: 'Bu odadan engellendiniz.' });
                    return;
                }

                const isOwner = state.ownerId === userId;
                if (!isOwner && state.settings.isLocked && password !== state.settings.password) {
                    socket.emit('partyRoomLocked', { roomId });
                    return;
                }

                // Checks passed - now safe to actually join the socket.io room
                socket.join(`party_${roomId}`);
                await partyManager.joinRoom(roomId, userId);

                const count = partyManager.getParticipantCount(roomId);
                await prisma.partyRoom.update({
                    where: { id: roomId },
                    data: { currentCount: count }
                });

                // Notify room about new participant
                const joiner = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { name: true, avatar: true }
                });
                socket.to(`party_${roomId}`).emit('partyParticipantJoined', {
                    id: userId,
                    name: joiner?.name || 'Kozmik Gezgin',
                    avatar: joiner?.avatar
                });
            } catch (e: any) {
                logger.error('Error joining party room:', e);
                socket.emit('partyError', { message: e.message || 'Odaya katılırken bir hata oluştu.' });
            }
        });

        socket.on('leavePartyRoom', async (roomId: string) => {
            if (!userId) return;
            socket.leave(`party_${roomId}`);
            try {
                partyManager.leaveRoom(roomId, userId);
                
                const count = partyManager.getParticipantCount(roomId);
                await prisma.partyRoom.update({
                    where: { id: roomId },
                    data: { currentCount: count }
                });
            } catch (e) {
                logger.error('Error leaving party room:', e);
            }
        });

        socket.on('partyAction', async (data: { roomId: string, action: string, seatIndex?: number, targetUserId?: string, isLocked?: boolean, isMuted?: boolean, label?: string }) => {
            if (!userId) return;
            const state = partyManager.getRoom(data.roomId);
            if (!state) return;
            const isOwner = state.ownerId === userId;
            const isModerator = state.moderators.includes(userId);
            const hasPower = isOwner || isModerator;

            switch (data.action) {
                case 'requestMic':
                    partyManager.requestMic(data.roomId, userId);
                    break;
                case 'takeSeat':
                    if (data.seatIndex !== undefined) partyManager.takeSeat(data.roomId, userId, data.seatIndex);
                    break;
                case 'leaveSeat':
                    partyManager.leaveSeat(data.roomId, userId);
                    break;
                case 'lockSeat':
                    if (hasPower && data.seatIndex !== undefined) partyManager.lockSeat(data.roomId, data.seatIndex, !!data.isLocked);
                    break;
                case 'kickSeat':
                    if (hasPower && data.seatIndex !== undefined) partyManager.kickFromSeat(data.roomId, data.seatIndex);
                    break;
                case 'muteSeat':
                    if (data.seatIndex !== undefined) {
                        // Users can mute themselves, or admins can mute others
                        const targetSeat = state.seats[data.seatIndex];
                        if (targetSeat && (targetSeat.userId === userId || hasPower)) {
                            partyManager.muteSeat(data.roomId, data.seatIndex, !!data.isMuted);
                        }
                    }
                    break;
                case 'setLabel':
                    if (hasPower && data.seatIndex !== undefined) partyManager.setSeatLabel(data.roomId, data.seatIndex, data.label || null);
                    break;
            }
        });

        socket.on('partyUpdateSettings', async (data: { roomId: string, settings: any }) => {
            if (!userId) return;
            const state = partyManager.getRoom(data.roomId);
            if (state && (state.ownerId === userId || state.moderators.includes(userId))) {
                partyManager.updateSettings(data.roomId, data.settings);
            }
        });

        socket.on('partyToggleLock', async (data: { roomId: string, isLocked: boolean, password?: string }) => {
            if (!userId) return;
            const state = partyManager.getRoom(data.roomId);
            if (state && (state.ownerId === userId || state.moderators.includes(userId))) {
                partyManager.toggleLock(data.roomId, data.isLocked, data.password);
            }
        });

        socket.on('partySetModerator', async (data: { roomId: string, targetUserId: string, isModerator: boolean }) => {
            if (!userId) return;
            const state = partyManager.getRoom(data.roomId);
            if (state && state.ownerId === userId) {
                partyManager.setModerator(data.roomId, data.targetUserId, data.isModerator);
            }
        });

        socket.on('partyBanUser', async (data: { roomId: string, targetUserId: string }) => {
            if (!userId) return;
            const state = partyManager.getRoom(data.roomId);
            if (state && (state.ownerId === userId || state.moderators.includes(userId))) {
                partyManager.banUser(data.roomId, data.targetUserId);
                // Force the banned user's socket(s) out of the room and notify them
                io.in(data.targetUserId).socketsLeave(`party_${data.roomId}`);
                io.to(data.targetUserId).emit('partyBanned', { roomId: data.roomId });
            }
        });

        socket.on('partyClearChat', async (data: { roomId: string }) => {
            if (!userId) return;
            const state = partyManager.getRoom(data.roomId);
            if (state && (state.ownerId === userId || state.moderators.includes(userId))) {
                io.to(`party_${data.roomId}`).emit('partyChatCleared');
            }
        });

        // ================= GAMES ================= //
        socket.on('sendPartyDice', async (data: { roomId: string }) => {
            if (!userId) return;
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
            const diceValue = Math.floor(Math.random() * 6) + 1;
            
            io.to(`party_${data.roomId}`).emit('newPartyMessage', {
                id: Date.now().toString() + Math.random(),
                sender: user,
                isSystem: true,
                color: 'text-orange-400',
                content: `${user?.name || 'Biri'} zar attı ve ${diceValue} geldi! 🎲`
            });
            io.to(`party_${data.roomId}`).emit('partyDiceRoll', { userId, value: diceValue });
        });

        socket.on('sendPartyRPS', async (data: { roomId: string }) => {
            if (!userId) return;
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
            const moves = ['Taş ✊', 'Kağıt ✋', 'Makas ✌️'];
            const move = moves[Math.floor(Math.random() * moves.length)];
            
            io.to(`party_${data.roomId}`).emit('newPartyMessage', {
                id: Date.now().toString() + Math.random(),
                sender: user,
                isSystem: true,
                color: 'text-blue-400',
                content: `${user?.name || 'Biri'} oynadı: ${move}`
            });
            io.to(`party_${data.roomId}`).emit('partyRPS', { userId, move });
        });

        socket.on('sendPartyLuckyNumber', async (data: { roomId: string }) => {
            if (!userId) return;
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
            const num = Math.floor(Math.random() * 9) + 1; // 1-9
            
            io.to(`party_${data.roomId}`).emit('newPartyMessage', {
                id: Date.now().toString() + Math.random(),
                sender: user,
                isSystem: true,
                color: 'text-purple-400',
                content: `${user?.name || 'Biri'} şanslı numarasını çekti: ${num} 🔢`
            });
            io.to(`party_${data.roomId}`).emit('partyLuckyNumber', { userId, value: num });
        });

        // ================= LUCKY PACKAGE ================= //
        socket.on('sendPartyLuckyPackage', async (data: { roomId: string, amount: number, pieces: number }) => {
            if (!userId || data.amount < 100 || data.pieces < 1) return;
            try {
                await prisma.$transaction(async (tx) => {
                    const sender = await tx.user.findUnique({ where: { id: userId } });
                    if (!sender || (sender.stardustBalance || 0) < data.amount) {
                        socket.emit('queueStatus', { status: 'error', message: 'Yetersiz Yıldız Tozu bakiyesi!' });
                        throw new Error('Yetersiz bakiye');
                    }
                    await tx.user.update({
                        where: { id: userId },
                        data: { stardustBalance: { decrement: data.amount } }
                    });

                    const pkgId = Date.now().toString() + Math.random().toString().substring(2, 6);
                    const pkg: LuckyPackage = {
                        id: pkgId,
                        roomId: data.roomId,
                        senderId: userId,
                        senderName: sender.name || 'Biri',
                        totalAmount: data.amount,
                        remainingAmount: data.amount,
                        totalPieces: data.pieces,
                        remainingPieces: data.pieces,
                        claims: [],
                        expiresAt: Date.now() + 60000 // 1 minute expire
                    };
                    activeLuckyPackages.set(pkgId, pkg);

                    io.to(`party_${data.roomId}`).emit('partyLuckyPackageDropped', pkg);
                    io.to(`party_${data.roomId}`).emit('newPartyMessage', {
                        id: pkgId,
                        sender: { id: userId, name: sender.name },
                        isSystem: true,
                        isPackage: true,
                        packageId: pkgId,
                        color: 'text-pink-400',
                        content: `${sender.name} odaya ${data.amount} 🌟 değerinde Şanslı Paket bıraktı! 🎁`
                    });
                });
                
                // Refresh balance for sender
                const fresh = await prisma.user.findUnique({ where: { id: userId }, select: { stardustBalance: true, diamondBalance: true }});
                socket.emit('balanceUpdated', { userId, ...fresh });

            } catch (e) {
                logger.error('Error sending lucky package:', e);
            }
        });

        socket.on('claimLuckyPackage', async (data: { roomId: string, packageId: string }) => {
            if (!userId) return;
            const pkg = activeLuckyPackages.get(data.packageId);
            
            if (!pkg || pkg.roomId !== data.roomId) {
                socket.emit('queueStatus', { status: 'error', message: 'Paket bulunamadı veya süresi dolmuş.' });
                return;
            }

            if (pkg.expiresAt < Date.now()) {
                activeLuckyPackages.delete(data.packageId);
                socket.emit('queueStatus', { status: 'error', message: 'Paketin süresi dolmuş.' });
                return;
            }

            if (pkg.claims.some(c => c.userId === userId)) {
                socket.emit('queueStatus', { status: 'error', message: 'Bu paketten zaten payınızı aldınız.' });
                return;
            }

            if (pkg.remainingPieces <= 0) {
                socket.emit('queueStatus', { status: 'error', message: 'Paket tamamen tükendi.' });
                return;
            }

            try {
                const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true }});
                if (!user) return;

                // Calculate random share
                let share = 0;
                if (pkg.remainingPieces === 1) {
                    share = pkg.remainingAmount;
                } else {
                    const maxShare = (pkg.remainingAmount / pkg.remainingPieces) * 2;
                    share = Math.floor(Math.random() * maxShare) + 1;
                    if (share > pkg.remainingAmount) share = pkg.remainingAmount;
                }

                pkg.remainingAmount -= share;
                pkg.remainingPieces -= 1;
                pkg.claims.push({ userId, userName: user.name || 'Biri', amount: share });

                // Add dust to user
                await prisma.user.update({
                    where: { id: userId },
                    data: { stardustBalance: { increment: share } }
                });

                // Emit claim result
                io.to(`party_${data.roomId}`).emit('partyLuckyPackageClaimed', {
                    packageId: pkg.id,
                    userId,
                    userName: user.name || 'Biri',
                    amount: share,
                    remainingPieces: pkg.remainingPieces
                });

                // Refresh balance for claimer
                const fresh = await prisma.user.findUnique({ where: { id: userId }, select: { stardustBalance: true, diamondBalance: true }});
                socket.emit('balanceUpdated', { userId, ...fresh });

                if (pkg.remainingPieces === 0) {
                    activeLuckyPackages.delete(pkg.id);
                }
            } catch (e) {
                logger.error('Error claiming lucky package:', e);
            }
        });
        // ========================================= //

        socket.on('sendPartyMessage', async (data: { roomId: string, content: string }) => {
            if (!socket.rooms.has(`party_${data.roomId}`)) return;
            if (!data.content || typeof data.content !== 'string' || data.content.length > 200) return;

            const cleanContent = data.content.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, avatar: true } });

            io.to(`party_${data.roomId}`).emit('newPartyMessage', {
                id: Date.now().toString(),
                sender: user,
                content: cleanContent
            });
        });

        socket.on('sendPartyGift', async (data: { roomId: string, giftId: string, targetUserId: string }) => {
            if (!userId || !data.targetUserId || !data.roomId) return;

            const room = partyManager.getRoom(data.roomId);
            if (!room || !room.participants.has(userId) || !room.participants.has(data.targetUserId)) {
                socket.emit('partyError', { message: 'Bu işlem için odada olmanız gerekir.' });
                return;
            }

            const catalogGift = PARTY_GIFTS[data.giftId];
            if (!catalogGift) {
                socket.emit('partyError', { message: 'Geçersiz hediye.' });
                return;
            }
            const giftPrice = catalogGift.price;

            try {
                const earned = Math.floor(giftPrice * 0.3);

                // Prisma Transaction: Deduct from sender, add 30% diamonds to receiver
                await prisma.$transaction(async (tx) => {
                    const sender = await tx.user.findUnique({ where: { id: userId } });
                    if (!sender || (sender.stardustBalance || 0) < giftPrice) {
                        throw new Error('Yetersiz Yıldız Tozu bakiyesi! Hediye göndermek için bakiye yükleyin.');
                    }

                    if (userId === data.targetUserId) {
                        // Self-gift: deduct stardust, add diamonds
                        await tx.user.update({
                            where: { id: userId },
                            data: {
                                stardustBalance: { decrement: giftPrice },
                                diamondBalance: { increment: earned }
                            }
                        });
                    } else {
                        // Gift to other user
                        await tx.user.update({
                            where: { id: userId },
                            data: { stardustBalance: { decrement: giftPrice } }
                        });
                        await tx.user.update({
                            where: { id: data.targetUserId },
                            data: { diamondBalance: { increment: earned } }
                        });
                    }

                    // Create Gift log
                    await tx.gift.create({
                        data: {
                            senderId: userId,
                            receiverId: data.targetUserId,
                            giftType: data.giftId,
                            stardustCost: giftPrice
                        }
                    });
                });

                // Fetch fresh balances from DB AFTER transaction
                const senderFresh = await prisma.user.findUnique({ 
                    where: { id: userId }, 
                    select: { id: true, name: true, avatar: true, stardustBalance: true, diamondBalance: true } 
                });
                const receiverFresh = await prisma.user.findUnique({ 
                    where: { id: data.targetUserId }, 
                    select: { id: true, name: true, avatar: true, stardustBalance: true, diamondBalance: true } 
                });
                
                // Add popularity to room
                partyManager.addPopularity(data.roomId, Math.floor(giftPrice / 10));

                // Broadcast gift event to entire room (with senderId for frontend identification)
                io.to(`party_${data.roomId}`).emit('partyGiftReceived', {
                    id: Date.now().toString(),
                    senderId: userId,
                    sender: { id: senderFresh?.id, name: senderFresh?.name, avatar: senderFresh?.avatar },
                    receiverName: receiverFresh?.name,
                    receiverId: data.targetUserId,
                    giftId: data.giftId,
                    giftPrice: giftPrice,
                    earnedDiamonds: earned
                });

                // Send updated balance DIRECTLY to sender's personal room
                io.to(userId).emit('balanceUpdated', {
                    userId,
                    stardustBalance: senderFresh?.stardustBalance ?? 0,
                    diamondBalance: senderFresh?.diamondBalance ?? 0
                });

                // Send updated balance to receiver (if different person)
                if (userId !== data.targetUserId) {
                    io.to(data.targetUserId).emit('balanceUpdated', {
                        userId: data.targetUserId,
                        stardustBalance: receiverFresh?.stardustBalance ?? 0,
                        diamondBalance: receiverFresh?.diamondBalance ?? 0
                    });
                }

                logger.info(`Gift sent: ${userId} -> ${data.targetUserId} | ${data.giftId} | -${giftPrice} stardust | +${earned} diamonds`);
            } catch (e: any) {
                logger.error('Gift error:', e.message);
                socket.emit('partyError', { message: e.message || 'Hediye gönderilemedi' });
            }
        });
        // ===========================

        // 'disconnecting' fires before Socket.IO clears socket.rooms, so this is the
        // only place we can still see which party rooms this socket was in.
        socket.on('disconnecting', () => {
            for (const room of socket.rooms) {
                if (room.startsWith('party_')) {
                    const roomId = room.slice('party_'.length);
                    partyManager.leaveRoom(roomId, userId);
                    prisma.partyRoom.update({
                        where: { id: roomId },
                        data: { currentCount: partyManager.getParticipantCount(roomId) }
                    }).catch(err => logger.error(`Error updating party room count on disconnect for ${roomId}:`, err));
                }
            }
        });

        socket.on('disconnect', () => {
            logger.debug(`Socket disconnected: ${userId}. Waiting 30s before marking offline.`);
            matchmakingService.removeFromQueue(userId);

            const timeoutId = setTimeout(async () => {
                disconnectTimeouts.delete(userId);
                try {
                    const now = new Date();
                    await prisma.user.update({
                        where: { id: userId },
                        data: { isOnline: false, lastSeen: now }
                    });
                    io.emit('userStatusChanged', { userId, isOnline: false, lastSeen: now });
                } catch (err) {
                    logger.error(`Error updating disconnect status for ${userId}:`, err);
                }
            }, 30000); // 30 saniye tolerans

            disconnectTimeouts.set(userId, timeoutId);
        });
    });
}
