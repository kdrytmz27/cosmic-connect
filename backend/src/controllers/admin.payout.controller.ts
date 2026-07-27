import { Request, Response } from 'express';
import { prisma } from '../index';

const VALID_STATUSES = ['PENDING', 'COMPLETED', 'REJECTED'] as const;
type PayoutStatus = typeof VALID_STATUSES[number];

/** Ödeme taleplerini durumuna göre listeler. Varsayılan olarak bekleyenler gelir. */
export const listPayouts = async (req: Request, res: Response) => {
    try {
        const requested = String(req.query.status || 'PENDING').toUpperCase();
        const status = VALID_STATUSES.includes(requested as PayoutStatus)
            ? (requested as PayoutStatus)
            : 'PENDING';

        const payouts = await prisma.payoutRequest.findMany({
            where: { status },
            // Bekleyenlerde en eski önce (sıraya giren önce ödensin), sonuçlananlarda en yeni önce
            orderBy: { createdAt: status === 'PENDING' ? 'asc' : 'desc' },
            take: 100,
            select: {
                id: true,
                amount: true,
                iban: true,
                status: true,
                createdAt: true,
                processedAt: true,
                teller: {
                    select: {
                        id: true,
                        user: { select: { id: true, name: true, email: true, diamondBalance: true } }
                    }
                }
            }
        });

        return res.json({ payouts });
    } catch (e: any) {
        return res.status(500).json({ error: e?.message || 'Ödeme talepleri alınamadı.' });
    }
};

/**
 * Bekleyen bir ödeme talebini sonuçlandırır.
 *
 * COMPLETE  - para banka üzerinden elle gönderildikten sonra işaretlenir.
 *             Tutar talep anında zaten düşüldüğü için burada bakiyeye dokunulmaz.
 * REJECT    - emanetteki tutar falcının elmas bakiyesine geri yüklenir.
 *
 * Durum güncellemesi koşullu updateMany ile yapılıyor: iki admin aynı anda
 * işlem yaparsa yalnızca biri geçiyor, iade iki kez çalışmıyor.
 */
export const processPayout = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const action = String(req.body?.action || '').toUpperCase();
        if (action !== 'COMPLETE' && action !== 'REJECT') {
            return res.status(400).json({ error: "action alanı 'COMPLETE' veya 'REJECT' olmalıdır." });
        }

        const payout = await prisma.payoutRequest.findUnique({
            where: { id: id as string },
            select: { id: true, amount: true, status: true, teller: { select: { userId: true } } }
        });
        if (!payout) return res.status(404).json({ error: 'Ödeme talebi bulunamadı.' });
        if (payout.status !== 'PENDING') {
            return res.status(400).json({ error: 'Bu talep zaten sonuçlandırılmış.' });
        }

        const nextStatus = action === 'COMPLETE' ? 'COMPLETED' : 'REJECTED';

        const updated = await prisma.$transaction(async (tx) => {
            const claimed = await tx.payoutRequest.updateMany({
                where: { id: payout.id, status: 'PENDING' },
                data: { status: nextStatus, processedAt: new Date() }
            });
            if (claimed.count === 0) {
                throw new Error('Bu talep başka bir işlemde sonuçlandırıldı.');
            }

            if (action === 'REJECT') {
                await tx.user.update({
                    where: { id: payout.teller.userId },
                    data: { diamondBalance: { increment: payout.amount } }
                });
            }

            return tx.payoutRequest.findUnique({
                where: { id: payout.id },
                select: { id: true, amount: true, status: true, processedAt: true }
            });
        });

        return res.json({ payout: updated });
    } catch (e: any) {
        return res.status(400).json({ error: e?.message || 'Ödeme talebi işlenemedi.' });
    }
};
