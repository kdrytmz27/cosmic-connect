import { Request, Response } from 'express';
import { prisma } from '../index';
import { CONSTANTS } from '../config/constants';

/**
 * Türk IBAN doğrulaması: TR + 24 rakam, ardından mod-97 sağlaması.
 *
 * Format kontrolü tek başına yetmiyor - tek hane yanlış yazılmış bir IBAN da
 * desene uyar. Para elle havale edileceği için hatalı hesaba gitmesini
 * engelleyen asıl kontrol mod-97.
 */
const isValidTurkishIban = (raw: string): boolean => {
    const iban = raw.replace(/\s+/g, '').toUpperCase();
    if (!/^TR\d{24}$/.test(iban)) return false;

    // İlk dört karakter sona taşınır, harfler sayıya çevrilir (A=10 ... Z=35)
    const rearranged = iban.slice(4) + iban.slice(0, 4);
    const numeric = rearranged.replace(/[A-Z]/g, ch => String(ch.charCodeAt(0) - 55));

    // Sayı 2^53'ü aştığı için parça parça mod alıyoruz
    let remainder = 0;
    for (const digit of numeric) {
        remainder = (remainder * 10 + Number(digit)) % 97;
    }
    return remainder === 1;
};

const normalizeIban = (raw: string): string => raw.replace(/\s+/g, '').toUpperCase();

const payoutSelect = {
    id: true,
    amount: true,
    iban: true,
    status: true,
    createdAt: true,
    processedAt: true
};

/**
 * Falcı ödeme talebi oluşturur.
 *
 * Tutar talep anında elmas bakiyesinden düşülür (emanet). Böylece bekleyen
 * talebin parası başka yerde harcanamıyor. Talep reddedilirse admin tarafında
 * iade ediliyor.
 */
export const createPayoutRequest = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const teller = await prisma.fortuneTeller.findUnique({ where: { userId } });
        if (!teller) {
            return res.status(403).json({ error: 'Ödeme talebi yalnızca falcılar tarafından oluşturulabilir.' });
        }

        const amount = Number(req.body?.amount);
        if (!Number.isInteger(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Geçerli bir tutar giriniz.' });
        }
        const { MIN_AMOUNT, MAX_AMOUNT } = CONSTANTS.PAYOUT;
        if (amount < MIN_AMOUNT) {
            return res.status(400).json({ error: `En az ${MIN_AMOUNT.toLocaleString('tr-TR')} elmas çekebilirsiniz.` });
        }
        if (amount > MAX_AMOUNT) {
            return res.status(400).json({ error: `Tek seferde en fazla ${MAX_AMOUNT.toLocaleString('tr-TR')} elmas çekebilirsiniz.` });
        }

        // IBAN gönderilmezse falcının kayıtlı IBAN'ı kullanılır
        const rawIban = typeof req.body?.iban === 'string' && req.body.iban.trim()
            ? req.body.iban
            : teller.iban;
        if (!rawIban) {
            return res.status(400).json({ error: 'Ödeme için IBAN gereklidir.' });
        }
        if (!isValidTurkishIban(rawIban)) {
            return res.status(400).json({ error: 'Geçersiz IBAN. TR ile başlayan 26 haneli bir IBAN giriniz.' });
        }
        const iban = normalizeIban(rawIban);

        const payout = await prisma.$transaction(async (tx) => {
            // Aynı anda birden fazla bekleyen talep, aynı bakiyenin iki kez
            // bloke edilmesine ve admin tarafında karışıklığa yol açıyor
            const pending = await tx.payoutRequest.findFirst({
                where: { tellerId: teller.id, status: 'PENDING' }
            });
            if (pending) {
                throw new Error('Zaten bekleyen bir ödeme talebiniz var. Sonuçlanmasını bekleyin.');
            }

            // Koşullu updateMany ile kontrol ve düşüm tek adımda - araya başka bir
            // harcama girip bakiyeyi eksiye düşüremiyor
            const deducted = await tx.user.updateMany({
                where: { id: userId, diamondBalance: { gte: amount } },
                data: { diamondBalance: { decrement: amount } }
            });
            if (deducted.count === 0) {
                throw new Error('Yetersiz elmas bakiyesi.');
            }

            // Bir dahaki talepte hazır gelsin
            await tx.fortuneTeller.update({ where: { id: teller.id }, data: { iban } });

            return tx.payoutRequest.create({
                data: { tellerId: teller.id, amount, iban },
                select: payoutSelect
            });
        });

        const fresh = await prisma.user.findUnique({
            where: { id: userId },
            select: { diamondBalance: true }
        });

        return res.status(201).json({ payout, diamondBalance: fresh?.diamondBalance ?? 0 });
    } catch (e: any) {
        return res.status(400).json({ error: e?.message || 'Ödeme talebi oluşturulamadı.' });
    }
};

/** Falcının kendi ödeme taleplerini, yenisi başta olacak şekilde döner. */
export const getMyPayouts = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const teller = await prisma.fortuneTeller.findUnique({ where: { userId } });
        if (!teller) {
            return res.status(403).json({ error: 'Bu bilgi yalnızca falcılar için geçerlidir.' });
        }

        const payouts = await prisma.payoutRequest.findMany({
            where: { tellerId: teller.id },
            orderBy: { createdAt: 'desc' },
            take: 50,
            select: payoutSelect
        });

        return res.json({ payouts, minAmount: CONSTANTS.PAYOUT.MIN_AMOUNT, iban: teller.iban });
    } catch (e: any) {
        return res.status(500).json({ error: e?.message || 'Ödeme talepleri alınamadı.' });
    }
};
