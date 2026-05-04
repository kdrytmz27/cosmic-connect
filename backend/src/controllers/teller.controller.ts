import { Request, Response } from 'express';
import { prisma } from '../index';
import { slotManager } from '../services/slot.service';
import { logger } from '../utils/logger';
import { UserRole } from '../enums/UserRole';

export const listTellers = async (req: Request, res: Response) => {
    try {
        const tellers = await prisma.fortuneTeller.findMany({
            include: { user: { select: { name: true, avatar: true, sunSign: true } } }
        });
        res.json(tellers);
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const bookAppointment = async (req: Request, res: Response) => {
    try {
        logger.debug('[bookAppointment] Request received', { body: req.body });
        const userId = req.user?.userId;
        const { tellerId, question, fortuneType } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

        logger.debug('[bookAppointment] Parsed data:', { userId, tellerId, fortuneType, question, imageUrl });

        if (!userId) {
            logger.error('[bookAppointment] Unauthorized');
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            logger.error('[bookAppointment] User not found');
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const APPOINTMENT_COST = 100;
        if (user.stardustBalance < APPOINTMENT_COST) {
            logger.error('[bookAppointment] Not enough stardust for user', { balance: user.stardustBalance });
            res.status(400).json({ error: 'Not enough stardust' });
            return;
        }

        const targetTeller = await prisma.fortuneTeller.findUnique({ where: { id: tellerId } });
        if (!targetTeller) {
            logger.error('[bookAppointment] Target teller not found', { tellerId });
            res.status(404).json({ error: 'Teller not found' });
            return;
        }

        const existingIn = await prisma.friendship.findFirst({
            where: { user1Id: userId, user2Id: targetTeller.userId }
        });
        const existingOut = await prisma.friendship.findFirst({
            where: { user1Id: targetTeller.userId, user2Id: userId }
        });

        const txTasks: any[] = [
            prisma.user.update({
                where: { id: userId },
                data: { stardustBalance: { decrement: APPOINTMENT_COST } }
            }),
            prisma.appointment.create({
                data: {
                    userId,
                    tellerId,
                    status: 'PENDING',
                    appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    stardustPrice: APPOINTMENT_COST,
                    question,
                    fortuneType: fortuneType || 'TAROT',
                    imageUrl: imageUrl || null
                }
            })
        ];

        if (!existingIn) {
            txTasks.push(prisma.friendship.create({ data: { user1Id: userId, user2Id: targetTeller.userId } }));
        }
        if (!existingOut && userId !== targetTeller.userId) {
            txTasks.push(prisma.friendship.create({ data: { user1Id: targetTeller.userId, user2Id: userId } }));
        }

        // Transactions ensure we take stardust AND book the appointment safely
        const txResults = await prisma.$transaction(txTasks);
        logger.debug('[bookAppointment] Transaction successful. Created appointment:', { appointment: txResults[1] });

        res.json({ message: 'Appointment booked successfully', cost: APPOINTMENT_COST });
    } catch (error) {
        logger.error('[bookAppointment] Internal server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const claimDailyStardust = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) { res.status(404).json({ error: 'User not found' }); return; }

        // Check if already claimed today to prevent unlimited farming
        const today = new Date().toISOString().split('T')[0];
        const lastClaim = user.lastDailyReward ? new Date(user.lastDailyReward).toISOString().split('T')[0] : null;

        if (lastClaim === today) {
            res.status(400).json({ error: 'Bugün zaten günlük stardust aldınız!' });
            return;
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                stardustBalance: { increment: 50 },
                lastDailyReward: new Date()
            }
        });

        res.json({ message: 'Stardust claimed!', newBalance: updated.stardustBalance });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const playSlot = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { betAmount = 10, betType } = req.body;
        if (!userId || !betType) { res.status(400).json({ error: 'Missing parameters' }); return; }

        const result = await slotManager.placeBet(userId, betAmount, betType);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message || 'Server error' });
    }
};

export const getSlotState = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    res.json(slotManager.getCurrentState(userId));
};

export const getPendingFortunes = async (req: Request, res: Response) => {
    try {
        logger.debug('[getPendingFortunes] Request received');
        const userId = req.user?.userId;
        if (!userId) {
            logger.error('[getPendingFortunes] Unauthorized');
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const teller = await prisma.fortuneTeller.findUnique({ where: { userId } });
        logger.debug('[getPendingFortunes] Found teller record for user', { userId, tellerId: teller?.id });
        if (!teller) {
            logger.error('[getPendingFortunes] User is not a teller');
            res.status(403).json({ error: 'Only tellers can access this' });
            return;
        }

        const fortunes = await prisma.appointment.findMany({
            where: { tellerId: teller.id, status: 'PENDING' },
            include: { user: { select: { name: true, avatar: true, sunSign: true, moonSign: true, risingSign: true } } },
            orderBy: { appointmentDate: 'desc' }
        });

        logger.debug(`[getPendingFortunes] Found ${fortunes.length} pending fortunes for teller`, { tellerId: teller.id });

        res.json(fortunes);
    } catch (e) {
        logger.error('[getPendingFortunes] Internal server error:', e);
        res.status(500).json({ error: 'Server error' });
    }
};

export const interpretFortune = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { appointmentId, interpretation } = req.body;
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const teller = await prisma.fortuneTeller.findUnique({ where: { userId } });
        if (!teller) { res.status(403).json({ error: 'Only tellers can access this' }); return; }

        const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
        if (!appointment || appointment.tellerId !== teller.id) {
            res.status(404).json({ error: 'Fortune not found or not yours' }); return;
        }

        const [updated] = await prisma.$transaction([
            prisma.appointment.update({
                where: { id: appointmentId },
                data: { status: 'COMPLETED', interpretation }
            }),
            prisma.user.update({
                where: { id: userId },
                data: { stardustBalance: { increment: appointment.stardustPrice } }
            })
        ]);

        res.json({ message: 'Fortune interpreted successfully', appointmentId: updated.id, status: updated.status });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const getMyFortunes = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const fortunes = await prisma.appointment.findMany({
            where: { userId },
            include: { teller: { include: { user: { select: { name: true, avatar: true } } } } },
            orderBy: { appointmentDate: 'desc' }
        });

        res.json(fortunes);
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const rateTeller = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { appointmentId, rating, comment } = req.body;
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        if (rating < 1 || rating > 5) { res.status(400).json({ error: 'Rating must be between 1 and 5' }); return; }

        const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId }, include: { teller: true } });
        if (!appointment || appointment.userId !== userId) {
            res.status(404).json({ error: 'Fortune not found' }); return;
        }
        if (appointment.status !== 'COMPLETED' || appointment.userRating !== null) {
            res.status(400).json({ error: 'Cannot rate this fortune' }); return;
        }

        const tellerId = appointment.tellerId;
        const teller = appointment.teller;

        const newReviewCount = teller.reviewCount + 1;
        const newRating = ((teller.rating * teller.reviewCount) + rating) / newReviewCount;

        const transactionOps: any[] = [
            prisma.appointment.update({
                where: { id: appointmentId },
                data: { userRating: rating }
            }),
            prisma.fortuneTeller.update({
                where: { id: tellerId },
                data: { reviewCount: newReviewCount, rating: newRating }
            })
        ];

        if (comment && comment.trim() !== '') {
            transactionOps.push(
                prisma.tellerComment.create({
                    data: { tellerId, userId, comment: comment.trim() }
                })
            );
        }

        await prisma.$transaction(transactionOps);

        res.json({ message: 'Rated successfully' });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const applyTeller = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) { res.status(404).json({ error: 'User not found' }); return; }
        if (user.role === UserRole.FORTUNE_TELLER) { res.status(400).json({ error: 'You are already a fortune teller' }); return; }

        const existingApp = await prisma.tellerApplication.findUnique({ where: { userId } });
        if (existingApp && existingApp.status === 'PENDING') {
            res.status(400).json({ error: 'You already have a pending application' });
            return;
        }

        const { experience, fortuneTypes } = req.body;
        if (!experience || !fortuneTypes) {
            res.status(400).json({ error: 'Experience and fortune types are required' });
            return;
        }

        const typesStr = Array.isArray(fortuneTypes) ? fortuneTypes.join(',') : fortuneTypes;

        let application;
        if (existingApp) {
            application = await prisma.tellerApplication.update({
                where: { userId },
                data: { experience, fortuneTypes: typesStr, status: 'PENDING' }
            });
        } else {
            application = await prisma.tellerApplication.create({
                data: { userId, experience, fortuneTypes: typesStr, status: 'PENDING' }
            });
        }

        res.json({ message: 'Application submitted successfully', application });
    } catch (e) {
        logger.error('Error applying teller:', e);
        res.status(500).json({ error: 'Server error' });
    }
};

export const checkApplicationStatus = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const application = await prisma.tellerApplication.findUnique({ where: { userId } });
        res.json({ application });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const approveApplication = async (req: Request, res: Response) => {
    try {
        // Verify caller is Admin to prevent unauthorized privilege escalation
        const callerRole = req.user?.role;
        if (callerRole !== UserRole.ADMIN) {
            res.status(403).json({ error: 'Only admins can approve applications' });
            return;
        }

        const { applicationId, status } = req.body; // status: 'APPROVED' or 'REJECTED'
        if (!['APPROVED', 'REJECTED'].includes(status)) {
            res.status(400).json({ error: 'Invalid status' });
            return;
        }

        const application = await prisma.tellerApplication.findUnique({ where: { id: applicationId } });
        if (!application) { res.status(404).json({ error: 'Application not found' }); return; }

        if (status === 'APPROVED') {
            await prisma.$transaction([
                prisma.tellerApplication.update({ where: { id: applicationId }, data: { status: 'APPROVED' } }),
                prisma.user.update({ where: { id: application.userId }, data: { role: UserRole.FORTUNE_TELLER } }),
                prisma.fortuneTeller.upsert({
                    where: { userId: application.userId },
                    update: { fortuneTypes: application.fortuneTypes },
                    create: {
                        userId: application.userId,
                        bio: `Merhaba, yıldızların rehberliğinde buradayım. Deneyim: ${application.experience}`,
                        skills: 'Genel Fal',
                        fortuneTypes: application.fortuneTypes
                    }
                })
            ]);
        } else {
            await prisma.tellerApplication.update({ where: { id: applicationId }, data: { status: 'REJECTED' } });
        }

        res.json({ message: `Application ${status.toLowerCase()}` });
    } catch (e) {
        logger.error('Error in approveApplication:', e);
        res.status(500).json({ error: 'Server error' });
    }
};

const FORTUNE_TYPE_LABELS: Record<string, string> = {
    TAROT: 'Tarot',
    KAHVE: 'Kahve Falı',
    EL: 'El Falı',
    YILDIZNAME: 'Yıldızname',
    RUNE: 'Rune Falı'
};

export const getTellerProfile = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const teller = await prisma.fortuneTeller.findUnique({
            where: { id: String(id) },
            include: {
                user: { select: { name: true, avatar: true, sunSign: true, moonSign: true, bio: true } },
                comments: {
                    include: { user: { select: { name: true, avatar: true } } },
                    orderBy: { createdAt: 'desc' },
                    take: 20
                },
                appointments: {
                    where: { status: 'COMPLETED' },
                    select: { stardustPrice: true }
                }
            }
        });
        if (!teller) { res.status(404).json({ error: 'Teller not found' }); return; }

        const completedApps = teller.appointments || [];
        (teller as any).totalReadings = completedApps.length;
        (teller as any).earnedStardust = completedApps.reduce((sum, app) => sum + (app.stardustPrice || 0), 0);
        delete (teller as any).appointments;

        const types = teller.fortuneTypes ? teller.fortuneTypes.split(',').map(t => ({
            code: t.trim(),
            label: FORTUNE_TYPE_LABELS[t.trim()] || t.trim()
        })) : [];

        res.json({ ...teller, parsedTypes: types });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const addTellerComment = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
        const { tellerId, comment } = req.body;
        if (!tellerId || !comment?.trim()) { res.status(400).json({ error: 'Missing fields' }); return; }
        if (comment.length > 500) { res.status(400).json({ error: 'Comment too long (max 500 characters)' }); return; }

        const created = await prisma.tellerComment.create({
            data: { tellerId: String(tellerId), userId, comment: String(comment).trim() },
            include: { user: { select: { name: true, avatar: true } } }
        });
        res.json(created);
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const getTellerComments = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const page = Number(req.query.page) || 1;
        const limit = Math.min(Number(req.query.limit) || 20, 50); // Max 50 per page
        const comments = await prisma.tellerComment.findMany({
            where: { tellerId: String(id) },
            include: { user: { select: { name: true, avatar: true } } },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit
        });
        res.json(comments);
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const uploadFortuneImage = async (req: Request, res: Response) => {
    if (!req.file) { res.status(400).json({ error: 'No image provided' }); return; }
    res.json({ imageUrl: `/uploads/${req.file.filename}` });
};

