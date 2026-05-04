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

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let canDraw = true;
        if (user.lastDailyTarot) {
            const lastDraw = new Date(user.lastDailyTarot);
            if (lastDraw >= today) {
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

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (user.lastDailyTarot) {
            const lastDraw = new Date(user.lastDailyTarot);
            if (lastDraw >= today) {
                return res.status(400).json({ error: 'Already drawn today' });
            }
        }

        const randomIndex = Math.floor(Math.random() * majorArcana.length);
        const selectedCard = majorArcana[randomIndex];

        await prisma.user.update({
            where: { id: userId },
            data: { lastDailyTarot: new Date() }
        });

        res.json({ success: true, card: selectedCard });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
