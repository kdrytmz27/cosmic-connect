import { Request, Response } from 'express';
import { prisma } from '../index';

// POST /api/user/block/:targetId  → Kullanıcıyı engelle
export const blockUser = async (req: Request, res: Response) => {
    const blockerId = req.user?.userId;
    const targetId = req.params['targetId'] as string;

    if (!blockerId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    if (!targetId) { res.status(400).json({ error: 'targetId gerekli' }); return; }
    if (blockerId === targetId) { res.status(400).json({ error: 'Kendinizi engelleyemezsiniz.' }); return; }

    try {
        await prisma.blockedUser.upsert({
            where: { blockerId_blockedId: { blockerId, blockedId: targetId } },
            create: { blockerId, blockedId: targetId },
            update: {}
        });
        res.json({ message: 'Kullanıcı engellendi.' });
    } catch (err) {
        res.status(500).json({ error: 'Engelleme başarısız.' });
    }
};

// DELETE /api/user/block/:targetId  → Engeli kaldır
export const unblockUser = async (req: Request, res: Response) => {
    const blockerId = req.user?.userId;
    const targetId = req.params['targetId'] as string;

    if (!blockerId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    if (!targetId) { res.status(400).json({ error: 'targetId gerekli' }); return; }

    try {
        await prisma.blockedUser.deleteMany({
            where: { blockerId, blockedId: targetId }
        });
        res.json({ message: 'Engel kaldırıldı.' });
    } catch (err) {
        res.status(500).json({ error: 'Engel kaldırma başarısız.' });
    }
};

// GET /api/user/blocked  → Engellenen kullanıcıları listele
export const getBlockedList = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const blocked = await prisma.blockedUser.findMany({
        where: { blockerId: userId },
        include: { blocked: { select: { id: true, name: true, avatar: true, sunSign: true } } }
    });
    res.json(blocked.map(b => b.blocked));
};

// POST /api/user/report/:targetId  → Şikayet oluştur
export const reportUser = async (req: Request, res: Response) => {
    const reporterId = req.user?.userId;
    const targetId = req.params['targetId'] as string;
    const { reason, description } = req.body;

    if (!reporterId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    if (!targetId) { res.status(400).json({ error: 'targetId gerekli' }); return; }
    if (!reason) { res.status(400).json({ error: 'Şikayet nedeni gereklidir.' }); return; }

    try {
        await prisma.report.create({
            data: { reporterId, reportedId: targetId, reason, description }
        });

        // FEAT-10: Reduce karma of the reported user
        await prisma.user.update({
            where: { id: targetId },
            data: { karma: { decrement: 20 } }
        });

        res.json({ message: 'Şikayetiniz iletildi. Teşekkürler.' });
    } catch (err) {
        res.status(500).json({ error: 'Şikayet gönderilemedi.' });
    }
};
