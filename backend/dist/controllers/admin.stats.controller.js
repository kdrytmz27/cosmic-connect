"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const index_1 = require("../index");
const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await index_1.prisma.user.count();
        const premiumUsers = await index_1.prisma.user.count({ where: { isPremium: true } });
        const totalAppointments = await index_1.prisma.appointment.count();
        const pendingTellers = await index_1.prisma.tellerApplication.count({ where: { status: 'PENDING' } });
        // Calculate total stardust in circulation
        const users = await index_1.prisma.user.findMany({ select: { stardustBalance: true } });
        const totalStardustCirculation = users.reduce((sum, user) => sum + user.stardustBalance, 0);
        // Get daily new users (last 7 days grouped)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentUsers = await index_1.prisma.user.findMany({
            where: { createdAt: { gte: sevenDaysAgo } },
            select: { createdAt: true }
        });
        // Group by day manually for simplicity
        const dailySignups = recentUsers.reduce((acc, user) => {
            const dateStr = user.createdAt.toISOString().split('T')[0];
            const date = dateStr;
            acc[date] = (acc[date] !== undefined ? acc[date] : 0) + 1;
            return acc;
        }, {});
        const dailyRegistrationData = Object.entries(dailySignups).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
        // Top 5 earning tellers
        const topTellers = await index_1.prisma.fortuneTeller.findMany({
            take: 5,
            orderBy: { rating: 'desc' },
            include: { user: { select: { name: true, avatar: true } } }
        });
        res.json({
            summary: {
                totalUsers,
                premiumUsers,
                totalAppointments,
                pendingTellers,
                totalStardustCirculation
            },
            charts: {
                dailyRegistrations: dailyRegistrationData,
                topTellers: topTellers.map((t) => ({ id: t.id, name: t.user.name, rating: t.rating, reviewCount: t.reviewCount }))
            }
        });
    }
    catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getDashboardStats = getDashboardStats;
//# sourceMappingURL=admin.stats.controller.js.map