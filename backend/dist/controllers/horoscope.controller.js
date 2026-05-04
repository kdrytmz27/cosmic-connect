"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getToday = void 0;
const horoscope_service_1 = require("../services/horoscope.service");
const index_1 = require("../index");
// Using string unions directly instead of Prisma Enums
const getToday = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const user = await index_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        // Get today's date strictly (e.g. 2026-02-28)
        const todayDateStr = new Date().toISOString().split('T')[0];
        const sign = user.sunSign;
        // Resolve deterministic predictions
        const uid = userId;
        const love = await horoscope_service_1.horoscopeService.getDailyHoroscope(uid, todayDateStr, sign, 'LOVE');
        const career = await horoscope_service_1.horoscopeService.getDailyHoroscope(uid, todayDateStr, sign, 'CAREER');
        const health = await horoscope_service_1.horoscopeService.getDailyHoroscope(uid, todayDateStr, sign, 'HEALTH');
        res.json({
            date: todayDateStr,
            sign,
            predictions: { love, career, health },
            stardustBalance: user.stardustBalance
        });
    }
    catch (error) {
        console.error('Horoscope error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getToday = getToday;
//# sourceMappingURL=horoscope.controller.js.map