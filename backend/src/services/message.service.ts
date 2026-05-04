import { prisma } from '../index';
import { getSocketIo } from '../controllers/socket.controller';
import { notificationService } from './notification.service';

export const messageService = {
    getMessages: async (userId: string, friendId: string) => {
        // ... omitting existing unchanged getMessages code ...
        // Security: Verify users have a relationship before allowing message access
        const friendship = await prisma.friendship.findFirst({
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

        return await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: friendId },
                    { senderId: friendId, receiverId: userId }
                ]
            },
            orderBy: { createdAt: 'asc' }
        });
    },

    sendMessage: async (userId: string, receiverId: string, content: string) => {
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

        const existingMessages = await prisma.message.findFirst({
            where: {
                OR: [
                    { senderId: userId, receiverId },
                    { senderId: receiverId, receiverId: userId }
                ]
            }
        });

        const msg = await prisma.message.create({
            data: { senderId: userId, receiverId, content }
        });

        // FEAT-08: Increment daily quest progress & FEAT-10: Karma
        await prisma.user.updateMany({
            where: { id: userId },
            data: {
                dailyQuestMessages: { increment: 1 },
                karma: { increment: 1 }
            }
        });

        const io = getSocketIo();
        if (io) {
            io.to(receiverId).emit('receivePrivateMessage', {
                senderId: userId,
                content,
                timestamp: msg.createdAt.getTime(),
                messageId: msg.id
            });
        }

        const senderInfo = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        await notificationService.createNotification({
            userId: receiverId,
            type: 'MESSAGE',
            title: senderInfo?.name || 'Yeni Mesaj',
            content: content.length > 50 ? content.substring(0, 47) + '...' : content,
            actionUrl: '/messages',
            entityId: msg.id
        });

        if (!existingMessages) {
            const swipeMatch = await prisma.friendship.findFirst({
                where: {
                    OR: [
                        { user1Id: userId, user2Id: receiverId },
                        { user1Id: receiverId, user2Id: userId }
                    ],
                    status: 'SWIPE_MATCH' as any
                }
            });

            if (swipeMatch && io) {
                const sender = await prisma.user.findUnique({
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
