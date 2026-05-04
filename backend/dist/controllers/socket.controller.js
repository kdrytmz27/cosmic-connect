"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocketIo = getSocketIo;
exports.setupSocket = setupSocket;
const jwt_1 = require("../utils/jwt");
const matchmaking_service_1 = require("../services/matchmaking.service");
const slot_service_1 = require("../services/slot.service");
const index_1 = require("../index");
const logger_1 = require("../utils/logger");
let _io = null;
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
        // User joins their personal room to receive private directed messages (like slot results)
        socket.join(userId);
        // Handle joining the Queue
        socket.on('joinMatchmaking', async () => {
            logger_1.logger.debug(`[Socket] User ${userId} requesting matchmaking`);
            const user = await index_1.prisma.user.findUnique({ where: { id: userId } });
            if (user?.role === 'FORTUNE_TELLER') {
                socket.emit('queueStatus', { status: 'error', message: 'Falcılar eşleşme kuyruğuna katılamaz.' });
                return;
            }
            await matchmaking_service_1.matchmakingService.joinQueue({ userId, socketId: socket.id, matchScore: user?.matchScore || 100, isPremium: user?.isPremium || false });
            socket.emit('queueStatus', { status: 'searching' });
            // Try to match immediately after joining
            const match = await matchmaking_service_1.matchmakingService.tryMatch();
            if (match) {
                const [p1, p2] = match;
                // Create room for initial socket communication (matchFound event)
                // No timeout callback needed — chat timer is now handled by acceptMatch + Messages
                const { roomId, duration } = await matchmaking_service_1.matchmakingService.createRoom(p1, p2, (_rId) => {
                    // Room expired but we don't create friendships here anymore
                    // acceptMatch handles friendship creation and timer
                    matchmaking_service_1.matchmakingService.removeRoom(_rId);
                });
                const socket1 = io.sockets.sockets.get(p1.socketId);
                const socket2 = io.sockets.sockets.get(p2.socketId);
                if (socket1 && socket2) {
                    socket1.join(roomId);
                    socket2.join(roomId);
                    // Notify users of successful match and start the 5-second modal client-side
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
            room.extraTimeRequests.add(userId);
            if (room.extraTimeRequests.size === 2) {
                // Both requested, grant 60s
                const extended = matchmaking_service_1.matchmakingService.extendRoomTime(data.roomId, 60000);
                if (extended) {
                    io.to(data.roomId).emit('extraTimeGranted', { addedSeconds: 60 });
                }
            }
            else {
                // Just notify the room that a user requested extra time
                io.to(data.roomId).emit('extraTimeRequested', { byUserId: userId });
            }
        });
        // Handle real-time ephemeral messages within the room (e.g., matchmaking rooms)
        socket.on('sendMessage', (data) => {
            // Security check: Only broadcast if the sender is actually inside the socket room
            if (!socket.rooms.has(data.roomId))
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
        // sendPrivateMessage removed (handled by REST API message.controller and socket emit)
        socket.on('typing', (data) => {
            if (data.roomId && socket.rooms.has(data.roomId)) {
                socket.to(data.roomId).emit('userTyping', { userId });
            }
            else if (data.receiverId) {
                io.to(data.receiverId).emit('userTyping', { senderId: userId });
            }
        });
        socket.on('stopTyping', (data) => {
            if (data.roomId && socket.rooms.has(data.roomId)) {
                socket.to(data.roomId).emit('userStoppedTyping', { userId });
            }
            else if (data.receiverId) {
                io.to(data.receiverId).emit('userStoppedTyping', { senderId: userId });
            }
        });
        socket.on('sendFriendRequest', (data) => {
            io.to(data.targetId).emit('friendRequest');
        });
        socket.on('friendRequestAccepted', (data) => {
            io.to(data.targetId).emit('friendRequestAccepted');
        });
        socket.on('joinGroup', (sign) => {
            socket.join(`group_${sign}`);
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
            logger_1.logger.debug(`Socket disconnected: ${userId}`);
            matchmaking_service_1.matchmakingService.removeFromQueue(userId);
        });
    });
}
//# sourceMappingURL=socket.controller.js.map