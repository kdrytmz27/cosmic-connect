"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocketIo = getSocketIo;
exports.setupSocket = setupSocket;
const jwt_1 = require("../utils/jwt");
const matchmaking_service_1 = require("../services/matchmaking.service");
const slot_service_1 = require("../services/slot.service");
const index_1 = require("../index");
const logger_1 = require("../utils/logger");
const UserRole_1 = require("../enums/UserRole");
let _io = null;
const disconnectTimeouts = new Map();
function getSocketIo() {
    return _io;
}
function setupSocket(io) {
    _io = io;
    // Middleware for Socket Authentication
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }
        const decoded = (0, jwt_1.verifyToken)(token);
        if (!decoded) {
            return next(new Error('Invalid token'));
        }
        socket.userId = decoded.userId;
        next();
    });
    if (!slot_service_1.slotManager.isInitialized) {
        slot_service_1.slotManager.initialize(io);
    }
    io.on('connection', (socket) => {
        const userId = socket.userId;
        logger_1.logger.debug(`Socket user connected: ${userId} - ${socket.id}`);
        // Eğer kullanıcının bekleyen bir kopma zamanlayıcısı varsa iptal et (30 saniye içinde geri döndü)
        if (disconnectTimeouts.has(userId)) {
            clearTimeout(disconnectTimeouts.get(userId));
            disconnectTimeouts.delete(userId);
        }
        // Set user as online
        index_1.prisma.user.update({
            where: { id: userId },
            data: { isOnline: true, lastSeen: null }
        }).then(() => {
            io.emit('userStatusChanged', { userId, isOnline: true, lastSeen: null });
        }).catch(err => logger_1.logger.error(`Error updating online status for ${userId}:`, err));
        // User joins their personal room to receive private directed messages (like slot results)
        socket.join(userId);
        // Handle joining the Queue
        socket.on('joinMatchmaking', async () => {
            logger_1.logger.debug(`[Socket] User ${userId} requesting matchmaking`);
            const user = await index_1.prisma.user.findUnique({ where: { id: userId } });
            if (user?.role === UserRole_1.UserRole.FORTUNE_TELLER) {
                socket.emit('queueStatus', { status: 'error', message: 'Falcılar eşleşme kuyruğuna katılamaz.' });
                return;
            }
            await matchmaking_service_1.matchmakingService.joinQueue({ userId, socketId: socket.id, matchScore: user?.matchScore || 100, isPremium: user?.isPremium || false, karma: user?.karma ?? 100, sunSign: user?.sunSign || null });
            socket.emit('queueStatus', { status: 'searching' });
            // Try to match immediately after joining.
            // Queue Starvation patched: process all possible matches
            const matches = await matchmaking_service_1.matchmakingService.tryMatch();
            for (const match of matches) {
                const [p1, p2] = match;
                // Create room for initial socket communication (matchFound event)
                const { roomId, duration } = await matchmaking_service_1.matchmakingService.createRoom(p1, p2, (_rId) => {
                    matchmaking_service_1.matchmakingService.removeRoom(_rId);
                });
                const socket1 = io.sockets.sockets.get(p1.socketId);
                const socket2 = io.sockets.sockets.get(p2.socketId);
                if (socket1 && socket2) {
                    socket1.join(roomId);
                    socket2.join(roomId);
                    io.to(roomId).emit('matchFound', { roomId, expiresIn: duration / 1000, users: [p1.userId, p2.userId] });
                }
            }
        });
        socket.on('leaveMatchmaking', () => {
            logger_1.logger.debug(`[Socket] User ${userId} leaving matchmaking queue`);
            matchmaking_service_1.matchmakingService.removeFromQueue(userId);
        });
        socket.on('requestExtraTime', (data) => {
            const room = matchmaking_service_1.matchmakingService.getRoom(data.roomId);
            if (!room)
                return;
            // Security check: Verify user is actually part of this room
            if (userId !== room.p1 && userId !== room.p2)
                return;
            if ((room.extensionsCount || 0) >= 2) {
                socket.emit('queueStatus', { status: 'error', message: 'Maksimum uzatma sınırına (2) ulaştınız. Lütfen arkadaş ekleyin.' });
                return;
            }
            // Immediately grant +160s when requested by ANY user
            const extended = matchmaking_service_1.matchmakingService.extendRoomTime(data.roomId, 160000);
            if (extended) {
                io.to(data.roomId).emit('extraTimeGranted', { addedSeconds: 160 });
            }
        });
        // Handle real-time ephemeral messages within the room (e.g., matchmaking rooms)
        socket.on('sendMessage', (data) => {
            // Security check: Only broadcast if the sender is actually inside the socket room
            if (!socket.rooms.has(data.roomId))
                return;
            // VULN 56 FIX: Content length validation to prevent Bandwidth Amplification
            if (!data.content || typeof data.content !== 'string')
                return;
            if (data.content.length > 1000)
                return;
            // Broadcast message back so frontend displays it
            socket.to(data.roomId).emit('chatMessage', {
                senderId: userId,
                content: data.content,
                timestamp: Date.now()
            });
        });
        socket.on('leaveRoom', (data) => {
            if (!socket.rooms.has(data.roomId))
                return;
            socket.to(data.roomId).emit('partnerLeftRoom');
            matchmaking_service_1.matchmakingService.removeRoom(data.roomId);
        });
        // Handle typing events strictly bound to roomId to prevent receiverId socket harassment (Ghost Ping)
        socket.on('typing', (data) => {
            if (data.roomId && socket.rooms.has(data.roomId)) {
                socket.to(data.roomId).emit('userTyping', { userId });
            }
        });
        socket.on('stopTyping', (data) => {
            if (data.roomId && socket.rooms.has(data.roomId)) {
                socket.to(data.roomId).emit('userStoppedTyping', { userId });
            }
        });
        // Removed insecure client-driven friend Request emits. 
        // They are now handled strictly via server-side REST API calls which verify friendships in the DB.
        socket.on('joinGroup', async (sign) => {
            if (!userId)
                return;
            const user = await index_1.prisma.user.findUnique({ where: { id: userId }, select: { sunSign: true, role: true } });
            if (user?.role === UserRole_1.UserRole.ADMIN || user?.sunSign === sign) {
                socket.join(`group_${sign}`);
            }
            else {
                socket.emit('queueStatus', { status: 'error', message: 'Bu burç grubuna katılma yetkiniz yok.' });
            }
        });
        socket.on('leaveGroup', (sign) => {
            socket.leave(`group_${sign}`);
        });
        // Track last group message time per user to prevent flooding
        const lastGroupMsgTime = new Map();
        socket.on('sendGroupMessage', async (data) => {
            if (!userId)
                return;
            // Content validation
            if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0)
                return;
            if (data.content.length > 500)
                return; // Max message length
            // VULN 57 FIX: Group Message IDOR - Verify user is actually a member of this group room
            if (!socket.rooms.has(`group_${data.sign}`)) {
                socket.emit('queueStatus', { status: 'error', message: 'IDOR Koruması: Bu gruba üye değilsiniz, mesaj gönderemezsiniz.' });
                return;
            }
            // Flood protection: 1 message per second per user
            const now = Date.now();
            const lastTime = lastGroupMsgTime.get(userId) || 0;
            if (now - lastTime < 1000)
                return;
            lastGroupMsgTime.set(userId, now);
            try {
                const msg = await index_1.prisma.groupMessage.create({
                    data: { roomId: data.sign, senderId: userId, content: data.content.trim() },
                    include: { sender: { select: { id: true, name: true, avatar: true, sunSign: true, cosmicStatus: true } } }
                });
                io.to(`group_${data.sign}`).emit('newGroupMessage', msg);
            }
            catch (e) {
                logger_1.logger.error('Error sending group msg:', e);
            }
        });
        socket.on('disconnect', () => {
            logger_1.logger.debug(`Socket disconnected: ${userId}. Waiting 30s before marking offline.`);
            matchmaking_service_1.matchmakingService.removeFromQueue(userId);
            const timeoutId = setTimeout(async () => {
                try {
                    const now = new Date();
                    await index_1.prisma.user.update({
                        where: { id: userId },
                        data: { isOnline: false, lastSeen: now }
                    });
                    io.emit('userStatusChanged', { userId, isOnline: false, lastSeen: now });
                    disconnectTimeouts.delete(userId);
                }
                catch (err) {
                    logger_1.logger.error(`Error updating disconnect status for ${userId}:`, err);
                }
            }, 30000); // 30 saniye tolerans
            disconnectTimeouts.set(userId, timeoutId);
        });
    });
}
//# sourceMappingURL=socket.controller.js.map