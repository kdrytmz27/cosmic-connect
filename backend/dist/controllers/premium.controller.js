"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addExtraTime = exports.superLike = exports.unblurProfile = exports.recordSwipe = exports.buyPremium = exports.buyStardust = void 0;
const index_1 = require("../index");
const buyStardust = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { amount } = req.body;
        if (!userId || !amount) {
            return res.status(400).json({ error: 'Invalid config' });
        }
        // Validate amount to prevent negative injection or absurdly high values
        const parsedAmount = Number(amount);
        if (!Number.isInteger(parsedAmount) || parsedAmount <= 0 || parsedAmount > 10000) {
            return res.status(400).json({ error: 'Invalid stardust amount. Must be 1-10000.' });
        }
        // TODO: In production, validate payment receipt (Apple Pay / Google Pay / Stripe)
        // before crediting Stardust. Without this, users can call this endpoint directly!
        const updated = await index_1.prisma.user.update({
            where: { id: userId },
            data: { stardustBalance: { increment: parsedAmount } }
        });
        res.json({ message: 'Stardust purchased!', balance: updated.stardustBalance });
    }
    catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.buyStardust = buyStardust;
const buyPremium = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(400).json({ error: 'Auth error' });
        }
        // TODO: Integrate payment gateway verification before activating premium
        // Currently activates premium without payment — MUST be secured before production
        const updated = await index_1.prisma.user.update({
            where: { id: userId },
            data: {
                isPremium: true,
                superLikesLeft: 5,
                extraTimeLeft: 10
            },
            // Exclude sensitive fields from response
            select: {
                id: true, email: true, name: true, isPremium: true,
                superLikesLeft: true, extraTimeLeft: true, stardustBalance: true
            }
        });
        res.json({ message: 'Premium activated!', user: updated });
    }
    catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
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
            const updated = await index_1.prisma.user.update({
                where: { id: userId },
                data: {
                    dailySwipes: { increment: 1 },
                    stardustBalance: { decrement: 20 },
                    lastSwipeDate: new Date()
                }
            });
            return res.json({ message: 'Swipe recorded (-20 stardust)', remaining: updated.stardustBalance, dailySwipes: updated.dailySwipes });
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
        await index_1.prisma.user.update({
            where: { id: userId },
            data: { stardustBalance: { decrement: 500 } }
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
        await index_1.prisma.user.update({
            where: { id: userId },
            data: {
                ...(useFree ? { superLikesLeft: { decrement: 1 } } : { stardustBalance: { decrement: cost } })
            }
        });
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
        const updated = await index_1.prisma.user.update({
            where: { id: userId },
            data: {
                ...(useFree ? { extraTimeLeft: { decrement: 1 } } : { stardustBalance: { decrement: cost } })
            }
        });
        res.json({ success: true, remaining: updated.stardustBalance });
    }
    catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.addExtraTime = addExtraTime;
//# sourceMappingURL=premium.controller.js.map