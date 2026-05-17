"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addExtraTime = exports.superLike = exports.unblurProfile = exports.recordSwipe = exports.buyPremium = exports.buyStardust = void 0;
const index_1 = require("../index");
const buyStardust = async (req, res) => {
    // SECURITY PATCH: Stardust purchases must be handled via verified RevenueCat webhooks
    return res.status(403).json({ error: 'Lütfen satın alımları mobil uygulama üzerinden yapın. (Yetkisiz API kullanımı)' });
};
exports.buyStardust = buyStardust;
const buyPremium = async (req, res) => {
    // SECURITY PATCH: Premium purchases must be handled via verified RevenueCat webhooks
    return res.status(403).json({ error: 'Lütfen satın alımları mobil uygulama üzerinden yapın. (Yetkisiz API kullanımı)' });
};
exports.buyPremium = buyPremium;
const recordSwipe = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        let user = await index_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        // Daily reset: if lastSwipeDate is a different day, reset counter
        const today = new Date().toISOString().split('T')[0];
        const lastDate = user.lastSwipeDate ? new Date(user.lastSwipeDate).toISOString().split('T')[0] : null;
        if (lastDate !== today) {
            user = await index_1.prisma.user.update({
                where: { id: userId },
                data: { dailySwipes: 0, lastSwipeDate: new Date() }
            });
        }
        // Premium users: unlimited swipes
        if (user.isPremium) {
            const updated = await index_1.prisma.user.update({
                where: { id: userId },
                data: { dailySwipes: { increment: 1 }, lastSwipeDate: new Date() }
            });
            return res.json({ message: 'Swipe recorded (Premium)', remaining: updated.stardustBalance, dailySwipes: updated.dailySwipes });
        }
        // Free users: 20 free swipes per day, then charge 20 stardust each
        if (user.dailySwipes >= 20) {
            if (user.stardustBalance < 20) {
                return res.status(403).json({ error: 'Not enough stardust for more swipes' });
            }
            const updatedCount = await index_1.prisma.user.updateMany({
                where: { id: userId, stardustBalance: { gte: 20 } },
                data: {
                    dailySwipes: { increment: 1 },
                    stardustBalance: { decrement: 20 },
                    lastSwipeDate: new Date()
                }
            });
            if (updatedCount.count === 0) {
                return res.status(403).json({ error: 'Yetersiz bakiye (veya işlem reddedildi)' });
            }
            const userState = await index_1.prisma.user.findUnique({ where: { id: userId } });
            return res.json({ message: 'Swipe recorded (-20 stardust)', remaining: userState?.stardustBalance, dailySwipes: userState?.dailySwipes });
        }
        // Free swipe
        const updated = await index_1.prisma.user.update({
            where: { id: userId },
            data: { dailySwipes: { increment: 1 }, lastSwipeDate: new Date() }
        });
        res.json({ message: 'Swipe recorded (Free)', remaining: updated.stardustBalance, dailySwipes: updated.dailySwipes });
    }
    catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.recordSwipe = recordSwipe;
const unblurProfile = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { targetId } = req.body;
        if (!userId || !targetId)
            return res.status(400).json({ error: 'Missing target' });
        // Prevent self-unblur
        if (userId === targetId)
            return res.status(400).json({ error: 'Cannot unblur yourself' });
        const user = await index_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        if (user.isPremium) {
            return res.json({ message: 'Premium is already unblurred', success: true });
        }
        // Check if already unblurred to prevent double-charge
        const existingUnblur = await index_1.prisma.friendship.findFirst({
            where: {
                OR: [
                    { user1Id: userId, user2Id: targetId },
                    { user1Id: targetId, user2Id: userId }
                ]
            }
        });
        // If they're already friends/matched, they don't need to pay
        if (existingUnblur) {
            const target = await index_1.prisma.user.findUnique({
                where: { id: targetId },
                select: { id: true, name: true, avatar: true, sunSign: true, moonSign: true, risingSign: true, bio: true }
            });
            return res.json({ message: 'Profile already accessible!', match: target, remainingStardust: user.stardustBalance });
        }
        if (user.stardustBalance < 500) {
            return res.status(403).json({ error: 'Not enough stardust to unblur' });
        }
        const updatedCount = await index_1.prisma.user.updateMany({
            where: { id: userId, stardustBalance: { gte: 500 } },
            data: { stardustBalance: { decrement: 500 } }
        });
        if (updatedCount.count === 0) {
            return res.status(403).json({ error: 'Not enough stardust to unblur (yetersiz bakiye kilitlendi)' });
        }
        // FIX #34: Create relationship record to make this purchase permanent
        await index_1.prisma.friendship.create({
            data: { user1Id: userId, user2Id: targetId, status: 'SWIPE_MATCH' }
        });
        // Return only safe fields — never expose passwordHash, twoFactorSecret, etc.
        const target = await index_1.prisma.user.findUnique({
            where: { id: targetId },
            select: { id: true, name: true, avatar: true, sunSign: true, moonSign: true, risingSign: true, bio: true }
        });
        res.json({ message: 'Profile unblurred!', match: target, remainingStardust: user.stardustBalance - 500 });
    }
    catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.unblurProfile = unblurProfile;
const superLike = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { targetId } = req.body;
        if (!userId || !targetId)
            return res.status(400).json({ error: 'Parameters missing' });
        // Prevent self super-like
        if (userId === targetId)
            return res.status(400).json({ error: 'Cannot super-like yourself' });
        const user = await index_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return res.status(404).json({ error: 'Not found' });
        // VULN 45 FIX: VIP Harassment SuperLike Block Bypass
        const isBlocked = await index_1.prisma.blockedUser.findFirst({
            where: {
                OR: [
                    { blockerId: userId, blockedId: targetId },
                    { blockerId: targetId, blockedId: userId }
                ]
            }
        });
        if (isBlocked) {
            return res.status(403).json({ error: 'Super Beğeni iptal edildi: Engellendiğiniz kişilere erişemezsiniz.' });
        }
        // Check for existing friendship to prevent duplicates
        const existingFriendship = await index_1.prisma.friendship.findFirst({
            where: { user1Id: userId, user2Id: targetId }
        });
        if (existingFriendship) {
            return res.status(400).json({ error: 'Already connected with this user' });
        }
        let cost = 500;
        let useFree = false;
        if (user.isPremium && user.superLikesLeft > 0) {
            cost = 0;
            useFree = true;
        }
        if (cost > 0 && user.stardustBalance < cost) {
            return res.status(403).json({ error: 'Not enough stardust for super like' });
        }
        const updatedCount = await index_1.prisma.user.updateMany({
            where: { id: userId, ...(useFree ? { superLikesLeft: { gt: 0 } } : { stardustBalance: { gte: cost } }) },
            data: {
                ...(useFree ? { superLikesLeft: { decrement: 1 } } : { stardustBalance: { decrement: cost } })
            }
        });
        if (updatedCount.count === 0) {
            return res.status(403).json({ error: 'İşlem engellendi (Bakiye veya hak yetersiz).' });
        }
        // Add them as friends automatically to bypass match limits
        await index_1.prisma.friendship.create({ data: { user1Id: userId, user2Id: targetId } });
        await index_1.prisma.message.create({
            data: {
                senderId: userId,
                receiverId: targetId,
                content: "🌟 SÜPER BEĞENİ! Seninle konuşmak istedim."
            }
        });
        res.json({ success: true, message: 'Super like sent!' });
    }
    catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.superLike = superLike;
const addExtraTime = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: 'Auth' });
        const user = await index_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return res.status(404).json({ error: 'Not found' });
        let cost = 50;
        let useFree = false;
        if (user.isPremium && user.extraTimeLeft > 0) {
            cost = 0;
            useFree = true;
        }
        if (cost > 0 && user.stardustBalance < cost) {
            return res.status(403).json({ error: 'Not enough stardust' });
        }
        const updatedCount = await index_1.prisma.user.updateMany({
            where: { id: userId, ...(useFree ? { extraTimeLeft: { gt: 0 } } : { stardustBalance: { gte: cost } }) },
            data: {
                ...(useFree ? { extraTimeLeft: { decrement: 1 } } : { stardustBalance: { decrement: cost } })
            }
        });
        if (updatedCount.count === 0) {
            return res.status(403).json({ error: 'İşlem engellendi (Bakiye veya hak yetersiz).' });
        }
        const freshUser = await index_1.prisma.user.findUnique({ where: { id: userId } });
        res.json({ success: true, remaining: freshUser?.stardustBalance });
    }
    catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.addExtraTime = addExtraTime;
//# sourceMappingURL=premium.controller.js.map