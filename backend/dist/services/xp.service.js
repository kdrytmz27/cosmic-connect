"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.xpService = void 0;
const index_1 = require("../index");
const badge_service_1 = require("./badge.service");
// Level formula: level * 100 XP to reach the next level.
// Ex: Lvl 1 -> 100 XP needed for Lvl 2
// Lvl 2 -> 200 XP needed for Lvl 3
exports.xpService = {
    addXp: async (userId, amount) => {
        const user = await index_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return null;
        let currentXp = user.xp + amount;
        let currentLevel = user.level;
        // Calculate if leveled up
        while (true) {
            const xpRequirement = currentLevel * 100;
            if (currentXp >= xpRequirement) {
                currentXp -= xpRequirement;
                currentLevel++;
            }
            else {
                break;
            }
        }
        const updatedUser = await index_1.prisma.user.update({
            where: { id: userId },
            data: {
                xp: currentXp,
                level: currentLevel
            }
        });
        await badge_service_1.BadgeService.checkAndAwardBadges(userId);
        return updatedUser;
    }
};
//# sourceMappingURL=xp.service.js.map