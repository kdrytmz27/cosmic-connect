import { Request, Response } from 'express';
import { prisma } from '../index';
import { logger } from '../utils/logger';

/**
 * POST /api/notification/register-token
 * Body: { pushToken: string }
 * 
 * Capacitor (Expo/FCM) cihaz token kayıt noktası.
 * Token, User kaydına pushToken alanı olarak yazılır.
 */
export const registerPushToken = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { pushToken } = req.body;

    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    if (!pushToken || typeof pushToken !== 'string') {
        res.status(400).json({ error: 'pushToken gereklidir.' });
        return;
    }

    try {
        // VULN 51 FIX: Push Token Privacy Leak Prevented (Clear from old owners first)
        await prisma.user.updateMany({
            where: { pushToken },
            data: { pushToken: null }
        });

        await prisma.user.update({
            where: { id: userId },
            data: { pushToken }
        });
        logger.info(`[Push] Token registered for user ${userId}`);
        res.json({ message: 'Push token kaydedildi.' });
    } catch (err) {
        logger.error('[Push] Error saving push token:', err);
        res.status(500).json({ error: 'Token kaydedilemedi.' });
    }
};

/**
 * DELETE /api/notification/register-token
 * 
 * Uygulamadan çıkış yapıldığında token temizlenir.
 */
export const removePushToken = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { pushToken: null }
        });
        res.json({ message: 'Push token silindi.' });
    } catch (err) {
        res.status(500).json({ error: 'Token silinemedi.' });
    }
};
