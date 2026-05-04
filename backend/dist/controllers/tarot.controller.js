"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drawDailyTarot = exports.getDailyTarotStatus = void 0;
const index_1 = require("../index");
const tarot_1 = require("../data/tarot");
const getDailyTarotStatus = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await index_1.prisma.user.findUnique({ where: { id: userId } });
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
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getDailyTarotStatus = getDailyTarotStatus;
const drawDailyTarot = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await index_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (user.lastDailyTarot) {
            const lastDraw = new Date(user.lastDailyTarot);
            if (lastDraw >= today) {
                return res.status(400).json({ error: 'Already drawn today' });
            }
        }
        const randomIndex = Math.floor(Math.random() * tarot_1.majorArcana.length);
        const selectedCard = tarot_1.majorArcana[randomIndex];
        await index_1.prisma.user.update({
            where: { id: userId },
            data: { lastDailyTarot: new Date() }
        });
        res.json({ success: true, card: selectedCard });
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.drawDailyTarot = drawDailyTarot;
//# sourceMappingURL=tarot.controller.js.map