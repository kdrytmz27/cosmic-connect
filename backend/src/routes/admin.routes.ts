import { Router } from 'express';
import { authenticate, isAdmin } from '../middlewares/auth.middleware';
import { getDashboardStats } from '../controllers/admin.stats.controller';
import { getAllUsers, updateUser, getTellerApplications, approveRejectTeller, getAllAppointments } from '../controllers/admin.controller';
import { getFinancialReports } from '../controllers/admin.finance.controller';
import { getAllReports, updateReportStatus } from '../controllers/admin.report.controller';

const router = Router();

// Secure all admin routes
router.use(authenticate);
router.use(isAdmin);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.patch('/users/:id', updateUser);
router.get('/tellers/applications', getTellerApplications);
router.post('/tellers/applications/:id', approveRejectTeller);
router.get('/appointments', getAllAppointments);

// Financials
router.get('/financial-reports', getFinancialReports);

// Reports / Complaints
router.get('/reports', getAllReports);
router.patch('/reports/:id/status', updateReportStatus);

export default router;
