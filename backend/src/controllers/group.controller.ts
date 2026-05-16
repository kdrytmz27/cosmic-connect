import { Request, Response } from 'express';
import { prisma } from '../index';

export const getGroupMessages = async (req: Request, res: Response) => {
    try {
        const sign = req.params.sign as string;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.sunSign !== sign) {
            return res.status(403).json({ error: 'IDOR Koruması: Sadece kendi burcunuzun grubuna erişebilirsiniz.' });
        }

        const messages = await prisma.groupMessage.findMany({
            where: { roomId: sign },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: { sender: { select: { id: true, name: true, avatar: true, sunSign: true } } }
        });
        res.json({ messages: messages.reverse() });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};
