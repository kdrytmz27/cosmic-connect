import { prisma } from '../index';
import { getSocketIo } from '../controllers/socket.controller';

export const notificationService = {
    // Tüm bildirimleri getir
    getUserNotifications: async (userId: string, limit: number = 50) => {
        return await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    },

    // Okunmamış sayısını getir
    getUnreadCount: async (userId: string) => {
        return await prisma.notification.count({
            where: { userId, isRead: false }
        });
    },

    // Belirli bir bildirimi okundu olarak işaretle
    markAsRead: async (userId: string, notificationId: string) => {
        return await prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true }
        });
    },

    // Tümünü okundu olarak işaretle
    markAllAsRead: async (userId: string) => {
        return await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });
    },

    // Bildirim oluştur ve soket ile canlı ilet
    createNotification: async (data: {
        userId: string,
        type: string,
        title: string,
        content: string,
        actionUrl?: string,
        entityId?: string
    }) => {
        const notification = await prisma.notification.create({
            data
        });

        // Online ise anında gönder
        const io = getSocketIo();
        if (io) {
            io.to(data.userId).emit('newNotification', notification);
        }

        return notification;
    }
};
