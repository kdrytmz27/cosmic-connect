"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFinancialReports = void 0;
const index_1 = require("../index");
const getFinancialReports = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateFilter = {};
        if (startDate) {
            dateFilter.gte = new Date(startDate);
        }
        if (endDate) {
            dateFilter.lte = new Date(endDate);
        }
        const whereClause = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};
        // Stardust economy: Sum of appointments and gifts (Stardust leaving/entering system)
        const [totalAppointments, totalGifts] = await Promise.all([
            index_1.prisma.appointment.aggregate({
                _sum: { stardustPrice: true },
                where: { status: 'COMPLETED', ...whereClause } // Assuming appointments have createdAt, wait they have appointmentDate
            }),
            index_1.prisma.gift.aggregate({
                _sum: { stardustCost: true },
                where: whereClause
            })
        ]);
        // Fix appointment date filter if needed
        const appWhereClause = Object.keys(dateFilter).length > 0 ? { appointmentDate: dateFilter } : {};
        const appointmentRevenue = await index_1.prisma.appointment.aggregate({
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
    }
    catch (error) {
        console.error('Error fetching financial reports:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getFinancialReports = getFinancialReports;
//# sourceMappingURL=admin.finance.controller.js.map