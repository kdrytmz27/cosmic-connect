import { Request, Response } from 'express';
import { prisma } from '../index';
import { majorArcana } from '../data/tarot';

export const getDailyTarotStatus = async (req: any, res: any) => {
    try {
        const userId = req.user.userId;
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // VULN 65 FIX: Use TR UTC+3 offset for consistent midnight boundary
        const TR_OFFSET = 3 * 60 * 60 * 1000;
        const now = Date.now();
        const todayTR = new Date(now + TR_OFFSET);
        todayTR.setUTCHours(0, 0, 0, 0);
        const todayUTC = new Date(todayTR.getTime() - TR_OFFSET);

        let canDraw = true;
        if (user.lastDailyTarot) {
            const lastDraw = new Date(user.lastDailyTarot.getTime() + TR_OFFSET);
            lastDraw.setUTCHours(0, 0, 0, 0);
            if (lastDraw >= todayTR) {
                canDraw = false;
            }
        }

        res.json({ canDraw, lastDraw: user.lastDailyTarot });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const drawDailyTarot = async (req: any, res: any) => {
    try {
        const userId = req.user.userId;
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) return res.status(404).json({ error: 'User not found' });

        // VULN 65 FIX: Use TR UTC+3 offset for consistent midnight boundary
        const TR_OFFSET = 3 * 60 * 60 * 1000;
        const now = Date.now();
        const todayTR = new Date(now + TR_OFFSET);
        todayTR.setUTCHours(0, 0, 0, 0);

        if (user.lastDailyTarot) {
            const lastDrawTR = new Date(user.lastDailyTarot.getTime() + TR_OFFSET);
            lastDrawTR.setUTCHours(0, 0, 0, 0);
            if (lastDrawTR >= todayTR) {
                return res.status(400).json({ error: 'Already drawn today' });
            }
        }

        const randomIndex = Math.floor(Math.random() * majorArcana.length);
        const selectedCard = majorArcana[randomIndex];

        // Optimistic Locking: Eğer başka bir istek halihazırda 'lastDailyTarot' u güncellemişse bu işlem patlar ve 2. kart verilmez
        const updatedCount = await prisma.user.updateMany({
            where: {
                id: userId,
                // Null ise veya today'den önceyse izin ver: JS tarafında teyit ettik 
                // ancak DB tarafında tam koruma için en azından aynı kullanıcının tek kaydı old. teyit edelim
                lastDailyTarot: user.lastDailyTarot
            },
            data: { lastDailyTarot: new Date() }
        });

        if (updatedCount.count === 0) {
            return res.status(403).json({ error: 'Yarış durumu engellendi (Birden fazla tarot çekilemez).' });
        }

        res.json({ success: true, card: selectedCard });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
