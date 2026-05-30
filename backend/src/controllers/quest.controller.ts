import { Request, Response } from 'express';
import { prisma } from '../index';
import { xpService } from '../services/xp.service';

const DAILY_QUEST_MATCH_REQ = 1;
const DAILY_QUEST_MESSAGE_REQ = 5;
const QUEST_REWARD = 50;

/**
 * Görevlerin sıfırlanıp sıfırlanmadığını kontrol eder.
 * Eğer son sıfırlama düne/önceye aitse sıfırlar.
 */
const checkAndResetQuests = async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    const today = new Date();
    // VULN 42 FIX: UTC+3 Timezone Fix for Quests
    const TR_OFFSET = 3 * 3600 * 1000;
    const adjustedToday = new Date(today.getTime() + TR_OFFSET);
    adjustedToday.setUTCHours(0, 0, 0, 0);

    const lastReset = user.lastQuestReset ? new Date(new Date(user.lastQuestReset).getTime() + TR_OFFSET) : null;
    if (lastReset) lastReset.setUTCHours(0, 0, 0, 0);

    if (!lastReset || lastReset < adjustedToday) {
        return await prisma.user.update({
            where: { id: userId },
            data: {
                dailyQuestMatches: 0,
                dailyQuestMessages: 0,
                dailyQuestClaimed: false,
                lastQuestReset: new Date()
            }
        });
    }

    return user;
};

export const getQuests = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const user = await checkAndResetQuests(userId);
        if (!user) { res.status(404).json({ error: 'User not found' }); return; }

        res.json({
            matches: { current: user.dailyQuestMatches, required: DAILY_QUEST_MATCH_REQ },
            messages: { current: user.dailyQuestMessages, required: DAILY_QUEST_MESSAGE_REQ },
            claimed: user.dailyQuestClaimed,
            reward: QUEST_REWARD
        });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const claimQuests = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const user = await checkAndResetQuests(userId);
        if (!user) { res.status(404).json({ error: 'User not found' }); return; }

        if (user.dailyQuestClaimed) {
            res.status(400).json({ error: 'Bugün görev ödüllerini zaten aldınız.' });
            return;
        }

        if (user.dailyQuestMatches < DAILY_QUEST_MATCH_REQ || user.dailyQuestMessages < DAILY_QUEST_MESSAGE_REQ) {
            res.status(400).json({ error: 'Görevler henüz tamamlanmadı.' });
            return;
        }

        const updatedCount = await prisma.user.updateMany({
            where: { id: userId, dailyQuestClaimed: false },
            data: {
                dailyQuestClaimed: true,
                stardustBalance: { increment: QUEST_REWARD }
            }
        });

        if (updatedCount.count === 0) {
            res.status(400).json({ error: 'Ödül çoktan alınmış (Race Condition Lock).' });
            return;
        }

        const updated = await prisma.user.findUnique({ where: { id: userId } });

        // Görev tamamlanınca ek XP veriyoruz
        await xpService.addXp(userId, 50);

        res.json({ message: 'Ödüller alındı!', remainingStardust: updated?.stardustBalance });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};
