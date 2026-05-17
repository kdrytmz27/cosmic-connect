"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageService = void 0;
const index_1 = require("../index");
const socket_controller_1 = require("../controllers/socket.controller");
const notification_service_1 = require("./notification.service");
exports.messageService = {
    getMessages: async (userId, friendId) => {
        // ... omitting existing unchanged getMessages code ...
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
        // VULN 37 FIX: Blocked User Verification
        const isBlocked = await index_1.prisma.blockedUser.findFirst({
            where: {
                OR: [
                    { blockerId: userId, blockedId: friendId },
                    { blockerId: friendId, blockedId: userId }
                ]
            }
        });
        if (isBlocked) {
            throw new Error('Güvenlik Duvarı: Bu kullanıcı engellendi veya sizi engelledi.');
        }
        if (friendship.status === 'MATCH' && friendship.expiresAt && friendship.expiresAt < new Date()) {
            throw new Error('Eşleşme süresi doldu');
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
        const friendship = await index_1.prisma.friendship.findFirst({
            where: {
                OR: [
                    { user1Id: userId, user2Id: receiverId },
                    { user1Id: receiverId, user2Id: userId }
                ]
            }
        });
        if (!friendship) {
            throw new Error('DM Zafiyeti Önlendi: Sadece eşleştiğiniz veya arkadaşınız olan kişilere mesaj gönderebilirsiniz.');
        }
        // VULN 37 FIX: Blocked User Verification for Sending
        const isBlocked = await index_1.prisma.blockedUser.findFirst({
            where: {
                OR: [
                    { blockerId: userId, blockedId: receiverId },
                    { blockerId: receiverId, blockedId: userId }
                ]
            }
        });
        if (isBlocked) {
            throw new Error('Güvenlik Duvarı Engeli: Block Listesindeki kullanıcılara mesaj ulaştırılamaz!');
        }
        if (friendship.status === 'MATCH' && friendship.expiresAt && friendship.expiresAt < new Date()) {
            throw new Error('Eşleşme süresi doldu, mesaj yollanamaz');
        }
        const msg = await index_1.prisma.message.create({
            data: { senderId: userId, receiverId, content }
        });
        // VULN 50 FIX: Removed 'karma: { increment: 1 }' from messaging to prevent Infinite Spam Farm
        await index_1.prisma.user.updateMany({
            where: { id: userId },
            data: {
                dailyQuestMessages: { increment: 1 }
            }
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
        const senderInfo = await index_1.prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        await notification_service_1.notificationService.createNotification({
            userId: receiverId,
            type: 'MESSAGE',
            title: senderInfo?.name || 'Yeni Mesaj',
            content: content.length > 50 ? content.substring(0, 47) + '...' : content,
            actionUrl: '/messages',
            entityId: msg.id
        });
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
                // VULN 72 FIX: Never expose email in socket events - use fixed fallback
                const sender = await index_1.prisma.user.findUnique({
                    where: { id: userId }, select: { name: true, avatar: true, sunSign: true }
                });
                io.to(receiverId).emit('swipeMatchChatStarted', {
                    fromUserId: userId,
                    fromUserName: sender?.name || 'Kozmik Ruh',
                    fromUserAvatar: sender?.avatar,
                    fromUserSunSign: sender?.sunSign
                });
            }
        }
        return msg;
    }
};
//# sourceMappingURL=message.service.js.map