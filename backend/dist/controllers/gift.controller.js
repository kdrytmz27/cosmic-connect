"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendGift = exports.GIFTS = void 0;
const index_1 = require("../index");
const socket_controller_1 = require("./socket.controller");
const xp_service_1 = require("../services/xp.service");
const badge_service_1 = require("../services/badge.service");
exports.GIFTS = {
    CRYSTAL: { id: 'CRYSTAL', emoji: '💎', cost: 50, name: 'Kristal' },
    MOON: { id: 'MOON', emoji: '🌙', cost: 100, name: 'Ay Işığı' },
    TAROT: { id: 'TAROT', emoji: '🃏', cost: 150, name: 'Tarot Kartı' },
    STAR: { id: 'STAR', emoji: '✨', cost: 200, name: 'Kader Yıldızı' }
};
const sendGift = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { receiverId, giftType } = req.body;
        // Prevent self-gifting
        if (userId === receiverId) {
            return res.status(400).json({ error: 'Kendine hediye gönderemezsin' });
        }
        // VULN 43 FIX: Block Harassment Bypass
        const isBlocked = await index_1.prisma.blockedUser.findFirst({
            where: {
                OR: [
                    { blockerId: userId, blockedId: receiverId },
                    { blockerId: receiverId, blockedId: userId }
                ]
            }
        });
        if (isBlocked) {
            return res.status(403).json({ error: 'Güvenlik Protokolü: Bu kullanıcının tarafınıza / tarafınızdan bloklu olduğu tespit edildi. Hediye gönderilemez.' });
        }
        const giftDef = Object.values(exports.GIFTS).find(g => g.id === giftType);
        if (!giftDef)
            return res.status(400).json({ error: 'Geçersiz hediye tipi' });
        // Use transaction to prevent Race Condition / Double-Spend
        const result = await index_1.prisma.$transaction(async (tx) => {
            // "gte" atomik denetimi sayesinde bir başkası araya girip bakiyeyi hızlıca çekse bile eksiye düşürmez.
            const updateResult = await tx.user.updateMany({
                where: {
                    id: userId,
                    stardustBalance: { gte: giftDef.cost }
                },
                data: { stardustBalance: { decrement: giftDef.cost } }
            });
            if (updateResult.count === 0) {
                throw new Error('Yetersiz Yıldız Tozu veya Aynı Anda Çok Fazla İstek (Guard)');
            }
            const updatedSender = await tx.user.findUnique({ where: { id: userId } });
            if (!updatedSender)
                throw new Error('Kullanıcı bulunamadı');
            await tx.user.update({
                where: { id: receiverId },
                data: { stardustBalance: { increment: Math.floor(giftDef.cost / 2) } }
            });
            const gift = await tx.gift.create({
                data: {
                    senderId: userId,
                    receiverId,
                    giftType,
                    stardustCost: giftDef.cost
                }
            });
            return { updatedSender, gift };
        });
        await xp_service_1.xpService.addXp(userId, 20);
        await badge_service_1.BadgeService.checkAndAwardBadges(userId);
        // Save a system message to chat history to show the gift
        const message = await index_1.prisma.message.create({
            data: {
                senderId: userId,
                receiverId,
                content: `GIFT:${giftType}`,
            }
        });
        const io = (0, socket_controller_1.getSocketIo)();
        if (io) {
            io.to(receiverId).emit('receivePrivateMessage', {
                senderId: userId,
                content: `GIFT:${giftType}`,
                timestamp: Date.now()
            });
            // Emit success to sender to update UI
            io.to(userId).emit('giftSentSuccess', {
                remainingStardust: result.updatedSender.stardustBalance,
                giftType,
                receiverId
            });
        }
        res.json({ success: true, remainingStardust: result.updatedSender.stardustBalance });
    }
    catch (error) {
        console.error('Error sending gift:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};
exports.sendGift = sendGift;
//# sourceMappingURL=gift.controller.js.map