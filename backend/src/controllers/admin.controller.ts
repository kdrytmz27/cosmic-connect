import { Request, Response } from 'express';
import { prisma } from '../index';
import { UserRole } from '../enums/UserRole';

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 20, search = '', role = '' } = req.query;
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        const whereClause: any = {};

        if (search) {
            whereClause.OR = [
                { email: { contains: search as string } },
                { name: { contains: search as string } }
            ];
        }

        if (role) {
            whereClause.role = role;
        }

        const users = await prisma.user.findMany({
            where: whereClause,
            skip,
            take: limitNum,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                stardustBalance: true,
                isPremium: true,
                createdAt: true,
                level: true,
                xp: true
            }
        });

        const totalCount = await prisma.user.count({ where: whereClause });

        res.json({
            users,
            totalPages: Math.ceil(totalCount / limitNum),
            currentPage: pageNum,
            totalCount
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { role, stardustBalance, isPremium, level, xp } = req.body;

        const dataToUpdate: any = {};

        // Validate role against whitelist to prevent arbitrary role injection
        if (role !== undefined) {
            const validRoles = [UserRole.STANDARD, UserRole.FORTUNE_TELLER, UserRole.ADMIN, 'BANNED'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ error: 'Invalid role value' });
            }
            dataToUpdate.role = role;
        }
        if (stardustBalance !== undefined) dataToUpdate.stardustBalance = Number(stardustBalance);
        if (isPremium !== undefined) dataToUpdate.isPremium = isPremium;
        if (level !== undefined) dataToUpdate.level = Number(level);
        if (xp !== undefined) dataToUpdate.xp = Number(xp);

        const user = await prisma.user.update({
            where: { id: id as string },
            data: dataToUpdate,
            // Exclude sensitive fields from response
            select: {
                id: true, email: true, name: true, role: true,
                stardustBalance: true, isPremium: true, level: true, xp: true, createdAt: true
            }
        });

        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getTellerApplications = async (req: Request, res: Response) => {
    try {
        const applications = await prisma.tellerApplication.findMany({
            where: { status: 'PENDING' },
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: 'desc' }
        });

        res.json(applications);
    } catch (error) {
        console.error('Error fetching teller applications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const approveRejectTeller = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'APPROVED' or 'REJECTED'

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // VULN 48 FIX: Teller Application State 500 Crash (Admin Overwrite Error Prevented)
        const applicationRecord = await prisma.tellerApplication.findUnique({ where: { id: id as string } });
        if (!applicationRecord) return res.status(404).json({ error: 'Application not found' });

        if (applicationRecord.status !== 'PENDING') {
            return res.status(400).json({ error: `State Error: This application is already ${applicationRecord.status}. Cannot re-approve.` });
        }

        const application = await prisma.tellerApplication.update({
            where: { id: id as string },
            data: { status: status as string }
        });

        if (status === 'APPROVED') {
            await prisma.user.update({
                where: { id: application.userId },
                data: { role: UserRole.FORTUNE_TELLER }
            });

            // Create default fortune teller profile
            await prisma.fortuneTeller.create({
                data: {
                    userId: application.userId,
                    skills: application.fortuneTypes,
                    bio: application.experience,
                    fortuneTypes: application.fortuneTypes
                }
            });
        }

        res.json({ message: `Application ${status.toLowerCase()} successfully`, application });
    } catch (error) {
        console.error('Error approving/rejecting teller:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAllAppointments = async (req: Request, res: Response) => {
    try {
        const appointments = await prisma.appointment.findMany({
            take: 50,
            orderBy: { appointmentDate: 'desc' },
            include: {
                teller: { include: { user: { select: { name: true, email: true } } } },
                user: { select: { name: true, email: true } }
            }
        });

        res.json(appointments);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
