import { Request, Response } from 'express';
import { prisma } from '../index';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const totalUsers = await prisma.user.count();
        const premiumUsers = await prisma.user.count({ where: { isPremium: true } });

        const totalAppointments = await prisma.appointment.count();
        const pendingTellers = await prisma.tellerApplication.count({ where: { status: 'PENDING' } });

        // Calculate total stardust in circulation
        const users = await prisma.user.findMany({ select: { stardustBalance: true } });
        const totalStardustCirculation = users.reduce((sum: number, user: { stardustBalance: number }) => sum + user.stardustBalance, 0);

        // Get daily new users (last 7 days grouped)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentUsers = await prisma.user.findMany({
            where: { createdAt: { gte: sevenDaysAgo } },
            select: { createdAt: true }
        });

        // Group by day manually for simplicity
        const dailySignups = recentUsers.reduce((acc: Record<string, number>, user: { createdAt: Date }) => {
            const dateStr = user.createdAt.toISOString().split('T')[0];
            const date = dateStr as string;
            acc[date] = (acc[date] !== undefined ? acc[date] : 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const dailyRegistrationData = Object.entries(dailySignups).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));

        // Top 5 earning tellers
        const topTellers = await prisma.fortuneTeller.findMany({
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
                topTellers: topTellers.map((t: any) => ({ id: t.id, name: t.user.name, rating: t.rating, reviewCount: t.reviewCount }))
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
