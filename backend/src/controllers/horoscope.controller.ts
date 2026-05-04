import { Request, Response } from 'express';
import { horoscopeService } from '../services/horoscope.service';
import { prisma } from '../index';
// Using string unions directly instead of Prisma Enums

export const getToday = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' }) as any;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' }) as any;

        // Get today's date strictly (e.g. 2026-02-28)
        const todayDateStr = new Date().toISOString().split('T')[0] as string;
        const sign = user.sunSign as string;

        // Resolve deterministic predictions
        const uid = userId as string;
        const love = await horoscopeService.getDailyHoroscope(uid, todayDateStr, sign, 'LOVE');
        const career = await horoscopeService.getDailyHoroscope(uid, todayDateStr, sign, 'CAREER');
        const health = await horoscopeService.getDailyHoroscope(uid, todayDateStr, sign, 'HEALTH');

        res.json({
            date: todayDateStr,
            sign,
            predictions: { love, career, health },
            stardustBalance: user.stardustBalance
        });
    } catch (error) {
        console.error('Horoscope error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
