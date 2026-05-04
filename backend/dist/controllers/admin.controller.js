"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllAppointments = exports.approveRejectTeller = exports.getTellerApplications = exports.updateUser = exports.getAllUsers = void 0;
const index_1 = require("../index");
const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', role = '' } = req.query;
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;
        const whereClause = {};
        if (search) {
            whereClause.OR = [
                { email: { contains: search } },
                { name: { contains: search } }
            ];
        }
        if (role) {
            whereClause.role = role;
        }
        const users = await index_1.prisma.user.findMany({
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
        const totalCount = await index_1.prisma.user.count({ where: whereClause });
        res.json({
            users,
            totalPages: Math.ceil(totalCount / limitNum),
            currentPage: pageNum,
            totalCount
        });
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAllUsers = getAllUsers;
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, stardustBalance, isPremium, level, xp } = req.body;
        const dataToUpdate = {};
        // Validate role against whitelist to prevent arbitrary role injection
        if (role !== undefined) {
            const validRoles = ['STANDARD', 'FORTUNE_TELLER', 'ADMIN'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ error: 'Invalid role value' });
            }
            dataToUpdate.role = role;
        }
        if (stardustBalance !== undefined)
            dataToUpdate.stardustBalance = Number(stardustBalance);
        if (isPremium !== undefined)
            dataToUpdate.isPremium = isPremium;
        if (level !== undefined)
            dataToUpdate.level = Number(level);
        if (xp !== undefined)
            dataToUpdate.xp = Number(xp);
        const user = await index_1.prisma.user.update({
            where: { id: id },
            data: dataToUpdate,
            // Exclude sensitive fields from response
            select: {
                id: true, email: true, name: true, role: true,
                stardustBalance: true, isPremium: true, level: true, xp: true, createdAt: true
            }
        });
        res.json({ message: 'User updated successfully', user });
    }
    catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateUser = updateUser;
const getTellerApplications = async (req, res) => {
    try {
        const applications = await index_1.prisma.tellerApplication.findMany({
            where: { status: 'PENDING' },
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(applications);
    }
    catch (error) {
        console.error('Error fetching teller applications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getTellerApplications = getTellerApplications;
const approveRejectTeller = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'APPROVED' or 'REJECTED'
        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const application = await index_1.prisma.tellerApplication.update({
            where: { id: id },
            data: { status: status }
        });
        if (status === 'APPROVED') {
            await index_1.prisma.user.update({
                where: { id: application.userId },
                data: { role: 'FORTUNE_TELLER' }
            });
            // Create default fortune teller profile
            await index_1.prisma.fortuneTeller.create({
                data: {
                    userId: application.userId,
                    skills: application.fortuneTypes,
                    bio: application.experience,
                    fortuneTypes: application.fortuneTypes
                }
            });
        }
        res.json({ message: `Application ${status.toLowerCase()} successfully`, application });
    }
    catch (error) {
        console.error('Error approving/rejecting teller:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.approveRejectTeller = approveRejectTeller;
const getAllAppointments = async (req, res) => {
    try {
        const appointments = await index_1.prisma.appointment.findMany({
            take: 50,
            orderBy: { appointmentDate: 'desc' },
            include: {
                teller: { include: { user: { select: { name: true, email: true } } } },
                user: { select: { name: true, email: true } }
            }
        });
        res.json(appointments);
    }
    catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAllAppointments = getAllAppointments;
//# sourceMappingURL=admin.controller.js.map