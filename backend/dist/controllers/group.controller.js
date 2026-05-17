"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGroupMessages = void 0;
const index_1 = require("../index");
const getGroupMessages = async (req, res) => {
    try {
        const sign = req.params.sign;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await index_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.sunSign !== sign) {
            return res.status(403).json({ error: 'IDOR Koruması: Sadece kendi burcunuzun grubuna erişebilirsiniz.' });
        }
        const messages = await index_1.prisma.groupMessage.findMany({
            where: { roomId: sign },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: { sender: { select: { id: true, name: true, avatar: true, sunSign: true } } }
        });
        res.json({ messages: messages.reverse() });
    }
    catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getGroupMessages = getGroupMessages;
//# sourceMappingURL=group.controller.js.map