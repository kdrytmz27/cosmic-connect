import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { UnauthorizedError } from '../utils/errors';

export const getNotifications = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    // VULN 62 FIX: Cap limit to prevent full-table dump via ?limit=999999
    const rawLimit = parseInt(req.query.limit as string) || 50;
    const limit = Math.min(rawLimit, 100);
    const notifications = await notificationService.getUserNotifications(userId, limit);
    res.json({ notifications });
};

export const getUnreadCount = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const count = await notificationService.getUnreadCount(userId);
    res.json({ unreadCount: count });
};

export const markAsRead = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const notificationId = req.params.id as string;
    if (!userId) throw new UnauthorizedError();

    await notificationService.markAsRead(userId, notificationId);
    res.json({ success: true });
};

export const markAllAsRead = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    await notificationService.markAllAsRead(userId);
    res.json({ success: true });
};
