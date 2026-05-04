import { prisma } from '../index';
import { BadgeService } from './badge.service';

// Level formula: level * 100 XP to reach the next level.
// Ex: Lvl 1 -> 100 XP needed for Lvl 2
// Lvl 2 -> 200 XP needed for Lvl 3

export const xpService = {
    addXp: async (userId: string, amount: number) => {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return null;

        let currentXp = user.xp + amount;
        let currentLevel = user.level;

        // Calculate if leveled up
        while (true) {
            const xpRequirement = currentLevel * 100;
            if (currentXp >= xpRequirement) {
                currentXp -= xpRequirement;
                currentLevel++;
            } else {
                break;
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                xp: currentXp,
                level: currentLevel
            }
        });
        await BadgeService.checkAndAwardBadges(userId);

        return updatedUser;
    }
};
