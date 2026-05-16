import { Request, Response } from 'express';
import { prisma } from '../index';

export const getFinancialReports = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        const dateFilter: any = {};
        if (startDate) {
            const parsedStart = new Date(startDate as string);
            if (!isNaN(parsedStart.getTime())) dateFilter.gte = parsedStart;
        }
        if (endDate) {
            const parsedEnd = new Date(endDate as string);
            if (!isNaN(parsedEnd.getTime())) dateFilter.lte = parsedEnd;
        }

        const whereClause = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

        // Stardust economy: Sum of appointments and gifts (Stardust leaving/entering system)
        const [totalAppointments, totalGifts] = await Promise.all([
            prisma.appointment.aggregate({
                _sum: { stardustPrice: true },
                where: { status: 'COMPLETED', ...whereClause } // Assuming appointments have createdAt, wait they have appointmentDate
            }),
            prisma.gift.aggregate({
                _sum: { stardustCost: true },
                where: whereClause
            })
        ]);

        // Fix appointment date filter if needed
        const appWhereClause = Object.keys(dateFilter).length > 0 ? { appointmentDate: dateFilter } : {};
        const appointmentRevenue = await prisma.appointment.aggregate({
            _sum: { stardustPrice: true },
            where: { status: 'COMPLETED', ...appWhereClause }
        });

        res.json({
            success: true,
            data: {
                totalStardustFromAppointments: appointmentRevenue._sum.stardustPrice || 0,
                totalStardustFromGifts: totalGifts._sum.stardustCost || 0,
                totalCirculation: (appointmentRevenue._sum.stardustPrice || 0) + (totalGifts._sum.stardustCost || 0)
            }
        });
    } catch (error) {
        console.error('Error fetching financial reports:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
