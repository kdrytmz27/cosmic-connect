"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadgeService = exports.BADGE_DEFINITIONS = void 0;
const index_1 = require("../index");
exports.BADGE_DEFINITIONS = {
    STAR_EXPLORER: {
        id: 'STAR_EXPLORER',
        name: 'Yıldız Kaşifi',
        description: 'Seviye 5\'e ulaştın!',
        icon: '🚀'
    },
    GENEROUS_SOUL: {
        id: 'GENEROUS_SOUL',
        name: 'Cömert Ruh',
        description: 'En az 5 hediye gönderdin!',
        icon: '🎁'
    },
    DAILY_PILGRIM: {
        id: 'DAILY_PILGRIM',
        name: 'Günlük Yolcu',
        description: '7 günlük giriş serisine ulaştın!',
        icon: '📅'
    },
    SOCIAL_BUTTERFLY: {
        id: 'SOCIAL_BUTTERFLY',
        name: 'Sosyal Kelebek',
        description: '10 arkadaşa ulaştın!',
        icon: '🦋'
    }
};
class BadgeService {
    static async checkAndAwardBadges(userId) {
        const MAX_RETRIES = 3;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            const user = await index_1.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    _count: {
                        select: {
                            sentGifts: true,
                            friendshipsUser1: true,
                            friendshipsUser2: true
                        }
                    }
                }
            });
            if (!user)
                return [];
            const existingBadges = Array.isArray(user.badges) ? user.badges : [];
            const newBadges = [...existingBadges];
            const awardedNow = [];
            // 1. Star Explorer (Level >= 5)
            if (!newBadges.includes('STAR_EXPLORER') && user.level >= 5) {
                newBadges.push('STAR_EXPLORER');
                awardedNow.push('STAR_EXPLORER');
            }
            // 2. Generous Soul (Gifts >= 5)
            if (!newBadges.includes('GENEROUS_SOUL') && user._count.sentGifts >= 5) {
                newBadges.push('GENEROUS_SOUL');
                awardedNow.push('GENEROUS_SOUL');
            }
            // 3. Daily Pilgrim (Streak >= 7)
            if (!newBadges.includes('DAILY_PILGRIM') && user.loginStreak >= 7) {
                newBadges.push('DAILY_PILGRIM');
                awardedNow.push('DAILY_PILGRIM');
            }
            // 4. Social Butterfly (Friends >= 10)
            const friendshipCount = user._count.friendshipsUser1 + user._count.friendshipsUser2;
            if (!newBadges.includes('SOCIAL_BUTTERFLY') && friendshipCount >= 10) {
                newBadges.push('SOCIAL_BUTTERFLY');
                awardedNow.push('SOCIAL_BUTTERFLY');
            }
            if (awardedNow.length > 0) {
                const updatedCount = await index_1.prisma.user.updateMany({
                    where: { id: userId },
                    data: { badges: newBadges }
                });
                // Başarılı ise çık ve rozetleri dön
                if (updatedCount.count > 0) {
                    return awardedNow;
                }
                // Başarısız ise başa dön ve güncel `badges` stringini tekrar Memory'e çek
            }
            else {
                // Eklenecek yeni rozet yoksa doğrudan çık
                return [];
            }
        }
        return [];
    }
}
exports.BadgeService = BadgeService;
//# sourceMappingURL=badge.service.js.map