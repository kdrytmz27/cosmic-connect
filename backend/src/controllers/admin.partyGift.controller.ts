import { Request, Response } from 'express';
import { prisma } from '../index';
import { giftCatalogService } from '../services/giftCatalog.service';

const VALID_CATEGORIES = ['BASLANGIC', 'ORTA', 'PREMIUM', 'LUKS'];
const VALID_TIERS = ['TOAST', 'FULLSCREEN'];

export const getAllPartyGifts = async (req: Request, res: Response) => {
    const gifts = await prisma.partyGift.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json({ gifts });
};

export const createPartyGift = async (req: Request, res: Response) => {
    const { giftKey, name, icon, price, category, animationUrl, animationTier, isLuckyEligible, sortOrder } = req.body;

    if (!giftKey || !name || !price || !category) {
        return res.status(400).json({ error: 'giftKey, name, price ve category zorunludur.' });
    }
    if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: `category şunlardan biri olmalı: ${VALID_CATEGORIES.join(', ')}` });
    }
    if (animationTier && !VALID_TIERS.includes(animationTier)) {
        return res.status(400).json({ error: `animationTier şunlardan biri olmalı: ${VALID_TIERS.join(', ')}` });
    }

    try {
        const gift = await prisma.partyGift.create({
            data: {
                giftKey, name, icon, price: Number(price), category,
                animationUrl, animationTier: animationTier || 'TOAST',
                isLuckyEligible: !!isLuckyEligible, sortOrder: sortOrder ? Number(sortOrder) : 0
            }
        });
        await giftCatalogService.refresh();
        res.status(201).json({ gift });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Bu giftKey zaten kullanılıyor.' });
        }
        res.status(500).json({ error: 'Hediye oluşturulamadı.' });
    }
};

export const updatePartyGift = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, icon, price, category, animationUrl, animationTier, isLuckyEligible, isActive, sortOrder } = req.body;

    if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: `category şunlardan biri olmalı: ${VALID_CATEGORIES.join(', ')}` });
    }
    if (animationTier !== undefined && !VALID_TIERS.includes(animationTier)) {
        return res.status(400).json({ error: `animationTier şunlardan biri olmalı: ${VALID_TIERS.join(', ')}` });
    }

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (icon !== undefined) data.icon = icon;
    if (price !== undefined) data.price = Number(price);
    if (category !== undefined) data.category = category;
    if (animationUrl !== undefined) data.animationUrl = animationUrl;
    if (animationTier !== undefined) data.animationTier = animationTier;
    if (isLuckyEligible !== undefined) data.isLuckyEligible = !!isLuckyEligible;
    if (isActive !== undefined) data.isActive = !!isActive;
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);

    try {
        const gift = await prisma.partyGift.update({ where: { id: id as string }, data });
        await giftCatalogService.refresh();
        res.json({ gift });
    } catch (error) {
        res.status(404).json({ error: 'Hediye bulunamadı.' });
    }
};

// Soft-delete only - never hard-delete a gift that historical Gift rows may reference by giftKey
export const deletePartyGift = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const gift = await prisma.partyGift.update({ where: { id: id as string }, data: { isActive: false } });
        await giftCatalogService.refresh();
        res.json({ gift });
    } catch (error) {
        res.status(404).json({ error: 'Hediye bulunamadı.' });
    }
};

// Public (authenticated, not admin-only) catalog endpoint consumed by GiftPanel.tsx
export const getPublicPartyGiftCatalog = async (req: Request, res: Response) => {
    res.json({ gifts: giftCatalogService.getAllActive() });
};
