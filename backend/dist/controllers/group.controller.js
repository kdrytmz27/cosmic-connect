"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGroupMessages = void 0;
const index_1 = require("../index");
const getGroupMessages = async (req, res) => {
    try {
        const sign = req.params.sign;
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