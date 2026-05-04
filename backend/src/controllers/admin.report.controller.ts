import { Request, Response } from 'express';
import { prisma } from '../index';

export const getAllReports = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        const whereClause: any = {};
        if (status && status !== 'ALL') {
            whereClause.status = status;
        }

        const reports = await prisma.report.findMany({
            where: whereClause,
            skip,
            take: limitNum,
            orderBy: { createdAt: 'desc' },
            include: {
                reporter: { select: { id: true, name: true, email: true } },
                reported: { select: { id: true, name: true, email: true, role: true } }
            }
        });

        const totalCount = await prisma.report.count({ where: whereClause });

        res.json({
            reports,
            totalPages: Math.ceil(totalCount / limitNum),
            currentPage: pageNum,
            totalCount
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateReportStatus = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { status } = req.body; // 'RESOLVED', 'DISMISSED'

        if (!['RESOLVED', 'DISMISSED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const report = await prisma.report.update({
            where: { id },
            data: { status }
        });

        res.json({ message: 'Report status updated', report });
    } catch (error) {
        console.error('Error updating report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const submitReport = async (req: Request, res: Response) => {
    try {
        const reporterId = req.user?.userId;
        const { reportedId, reason, description } = req.body;

        if (!reporterId || !reportedId || !reason) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Prevent self-reporting
        if (reporterId === reportedId) {
            return res.status(400).json({ error: 'Kendinizi raporlayamazsınız' });
        }

        // Validate reason length to prevent spam
        if (reason.length > 500 || (description && description.length > 2000)) {
            return res.status(400).json({ error: 'Reason/description too long' });
        }

        // Prevent duplicate reports for the same user
        const existingReport = await prisma.report.findFirst({
            where: { reporterId, reportedId, status: 'PENDING' }
        });
        if (existingReport) {
            return res.status(400).json({ error: 'Bu kullanıcıyı zaten raporladınız' });
        }

        const report = await prisma.report.create({
            data: {
                reporterId,
                reportedId,
                reason,
                description
            }
        });

        res.status(201).json({ success: true, report });
    } catch (error) {
        console.error('Error submitting report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
