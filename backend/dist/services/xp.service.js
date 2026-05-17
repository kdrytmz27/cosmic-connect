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
        const MAX_RETRIES = 5;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            const user = await index_1.prisma.user.findUnique({ where: { id: userId } });
            if (!user)
                return null;
            let currentXp = user.xp + amount;
            let currentLevel = user.level;
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
            // Optimistic Lock: Update ONLY if xp AND level haven't changed since we queried
            const updatedResult = await index_1.prisma.user.updateMany({
                where: {
                    id: userId,
                    xp: user.xp,
                    level: user.level
                },
                data: {
                    xp: currentXp,
                    level: currentLevel
                }
            });
            // If success, break out of retry loop
            if (updatedResult.count > 0) {
                const freshUser = await index_1.prisma.user.findUnique({ where: { id: userId } });
                await badge_service_1.BadgeService.checkAndAwardBadges(userId);
                return freshUser;
            }
            // Overwritten by parallel request, loop again to retry
        }
        return null;
    }
};
//# sourceMappingURL=xp.service.js.map