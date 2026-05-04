"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageService = void 0;
const index_1 = require("../index");
const socket_controller_1 = require("../controllers/socket.controller");
exports.messageService = {
    getMessages: async (userId, friendId) => {
        // Security: Verify users have a relationship before allowing message access
        const friendship = await index_1.prisma.friendship.findFirst({
            where: {
                OR: [
                    { user1Id: userId, user2Id: friendId },
                    { user1Id: friendId, user2Id: userId }
                ]
            }
        });
        if (!friendship) {
            throw new Error('Bu kullanıcıyla mesajlaşma yetkiniz yok');
        }
        return await index_1.prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: friendId },
                    { senderId: friendId, receiverId: userId }
                ]
            },
            orderBy: { createdAt: 'asc' }
        });
    },
    sendMessage: async (userId, receiverId, content) => {
        // Prevent self-messaging
        if (userId === receiverId) {
            throw new Error('Kendinize mesaj gönderemezsiniz');
        }
        // Content validation
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            throw new Error('Mesaj içeriği boş olamaz');
        }
        if (content.length > 2000) {
            throw new Error('Mesaj çok uzun (max 2000 karakter)');
        }
        const existingMessages = await index_1.prisma.message.findFirst({
            where: {
                OR: [
                    { senderId: userId, receiverId },
                    { senderId: receiverId, receiverId: userId }
                ]
            }
        });
        const msg = await index_1.prisma.message.create({
            data: { senderId: userId, receiverId, content }
        });
        const io = (0, socket_controller_1.getSocketIo)();
        if (io) {
            io.to(receiverId).emit('receivePrivateMessage', {
                senderId: userId,
                content,
                timestamp: msg.createdAt.getTime(),
                messageId: msg.id
            });
        }
        if (!existingMessages) {
            const swipeMatch = await index_1.prisma.friendship.findFirst({
                where: {
                    OR: [
                        { user1Id: userId, user2Id: receiverId },
                        { user1Id: receiverId, user2Id: userId }
                    ],
                    status: 'SWIPE_MATCH'
                }
            });
            if (swipeMatch && io) {
                const sender = await index_1.prisma.user.findUnique({
                    where: { id: userId }, select: { name: true, avatar: true, sunSign: true, email: true }
                });
                io.to(receiverId).emit('swipeMatchChatStarted', {
                    fromUserId: userId,
                    fromUserName: sender?.name || sender?.email?.split('@')[0] || 'Birisi',
                    fromUserAvatar: sender?.avatar,
                    fromUserSunSign: sender?.sunSign
                });
            }
        }
        return msg;
    }
};
//# sourceMappingURL=message.service.js.map