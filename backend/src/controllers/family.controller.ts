import { Request, Response } from 'express';
import { prisma } from '../index';
import { CONSTANTS } from '../config/constants';

const memberSelect = {
    id: true,
    role: true,
    contributionScore: true,
    joinedAt: true,
    user: { select: { id: true, name: true, avatar: true, level: true } }
};

export const createFamily = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { name } = req.body;
        if (!name || typeof name !== 'string' || name.trim().length < 3 || name.trim().length > 30) {
            return res.status(400).json({ error: 'Aile adı 3-30 karakter arasında olmalıdır.' });
        }

        const existingMembership = await prisma.familyMember.findUnique({ where: { userId } });
        if (existingMembership) {
            return res.status(400).json({ error: 'Zaten bir ailenin üyesisiniz. Önce mevcut ailenizden ayrılın.' });
        }

        const fee = CONSTANTS.COSTS.CREATE_FAMILY;
        const family = await prisma.$transaction(async (tx) => {
            const deducted = await tx.user.updateMany({
                where: { id: userId, stardustBalance: { gte: fee } },
                data: { stardustBalance: { decrement: fee } }
            });
            if (deducted.count === 0) {
                throw new Error('Yetersiz Yıldız Tozu! Aile kurmak için ' + fee + ' Yıldız Tozu gerekir.');
            }

            const newFamily = await tx.family.create({
                data: { name: name.trim(), leaderId: userId }
            });
            await tx.familyMember.create({
                data: { familyId: newFamily.id, userId, role: 'LEADER' }
            });
            return newFamily;
        });

        res.status(201).json({ family });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Bu aile adı zaten kullanılıyor.' });
        }
        res.status(400).json({ error: error.message || 'Aile kurulamadı.' });
    }
};

export const joinFamily = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        const familyId = req.params.id as string;

        const existingMembership = await prisma.familyMember.findUnique({ where: { userId } });
        if (existingMembership) {
            return res.status(400).json({ error: 'Zaten bir ailenin üyesisiniz.' });
        }

        const family = await prisma.family.findUnique({ where: { id: familyId } });
        if (!family) return res.status(404).json({ error: 'Aile bulunamadı.' });

        const member = await prisma.familyMember.create({
            data: { familyId, userId, role: 'MEMBER' }
        });
        res.status(201).json({ member });
    } catch (error) {
        res.status(500).json({ error: 'Aileye katılamadınız.' });
    }
};

export const leaveFamily = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const membership = await prisma.familyMember.findUnique({ where: { userId } });
        if (!membership) return res.status(400).json({ error: 'Bir aileye üye değilsiniz.' });

        if (membership.role === 'LEADER') {
            const otherMembers = await prisma.familyMember.findMany({
                where: { familyId: membership.familyId, userId: { not: userId } },
                orderBy: { joinedAt: 'asc' },
                take: 1
            });
            if (otherMembers.length > 0) {
                // Hand leadership to the longest-standing remaining member
                await prisma.$transaction([
                    prisma.familyMember.update({ where: { id: otherMembers[0]!.id }, data: { role: 'LEADER' } }),
                    prisma.family.update({ where: { id: membership.familyId }, data: { leaderId: otherMembers[0]!.userId } }),
                    prisma.familyMember.delete({ where: { userId } })
                ]);
            } else {
                // Last member leaving - dissolve the family
                await prisma.$transaction([
                    prisma.familyMember.delete({ where: { userId } }),
                    prisma.family.delete({ where: { id: membership.familyId } })
                ]);
            }
        } else {
            await prisma.familyMember.delete({ where: { userId } });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Aileden ayrılamadınız.' });
    }
};

export const getMyFamily = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const membership = await prisma.familyMember.findUnique({ where: { userId } });
        if (!membership) return res.json({ family: null });

        const family = await prisma.family.findUnique({
            where: { id: membership.familyId },
            include: { members: { select: memberSelect, orderBy: { contributionScore: 'desc' } } }
        });
        res.json({ family });
    } catch (error) {
        res.status(500).json({ error: 'Aile bilgisi getirilemedi.' });
    }
};

export const getFamilyById = async (req: Request, res: Response) => {
    try {
        const family = await prisma.family.findUnique({
            where: { id: req.params.id as string },
            include: { members: { select: memberSelect, orderBy: { contributionScore: 'desc' } } }
        });
        if (!family) return res.status(404).json({ error: 'Aile bulunamadı.' });
        res.json({ family });
    } catch (error) {
        res.status(500).json({ error: 'Aile bilgisi getirilemedi.' });
    }
};

export const listFamilies = async (req: Request, res: Response) => {
    try {
        const families = await prisma.family.findMany({
            orderBy: { totalScore: 'desc' },
            take: 50,
            select: { id: true, name: true, avatarUrl: true, level: true, totalScore: true, _count: { select: { members: true } } }
        });
        res.json({ families });
    } catch (error) {
        res.status(500).json({ error: 'Aile listesi getirilemedi.' });
    }
};

export const updateFamily = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        const familyId = req.params.id as string;

        const family = await prisma.family.findUnique({ where: { id: familyId } });
        if (!family) return res.status(404).json({ error: 'Aile bulunamadı.' });
        if (family.leaderId !== userId) return res.status(403).json({ error: 'Sadece aile lideri düzenleyebilir.' });

        const { announcement, avatarUrl } = req.body;
        const data: any = {};
        if (announcement !== undefined) data.announcement = announcement;
        if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;

        const updated = await prisma.family.update({ where: { id: familyId }, data });
        res.json({ family: updated });
    } catch (error) {
        res.status(500).json({ error: 'Aile güncellenemedi.' });
    }
};

export const promoteMember = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        const familyId = req.params.id as string;
        const { targetUserId, role } = req.body;

        if (!['MEMBER', 'VICE'].includes(role)) {
            return res.status(400).json({ error: 'Geçersiz rol.' });
        }

        const family = await prisma.family.findUnique({ where: { id: familyId } });
        if (!family) return res.status(404).json({ error: 'Aile bulunamadı.' });
        if (family.leaderId !== userId) return res.status(403).json({ error: 'Sadece aile lideri rol değiştirebilir.' });

        const targetMember = await prisma.familyMember.findUnique({ where: { userId: targetUserId } });
        if (!targetMember || targetMember.familyId !== familyId) {
            return res.status(400).json({ error: 'Bu kullanıcı bu ailenin üyesi değil.' });
        }

        const updated = await prisma.familyMember.update({ where: { userId: targetUserId }, data: { role } });
        res.json({ member: updated });
    } catch (error) {
        res.status(500).json({ error: 'Rol güncellenemedi.' });
    }
};
