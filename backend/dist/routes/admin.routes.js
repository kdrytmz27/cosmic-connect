"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const admin_stats_controller_1 = require("../controllers/admin.stats.controller");
const admin_controller_1 = require("../controllers/admin.controller");
const admin_finance_controller_1 = require("../controllers/admin.finance.controller");
const admin_report_controller_1 = require("../controllers/admin.report.controller");
const router = (0, express_1.Router)();
// Secure all admin routes
router.use(auth_middleware_1.authenticate);
router.use(auth_middleware_1.isAdmin);
router.get('/stats', admin_stats_controller_1.getDashboardStats);
router.get('/users', admin_controller_1.getAllUsers);
router.patch('/users/:id', admin_controller_1.updateUser);
router.get('/tellers/applications', admin_controller_1.getTellerApplications);
router.post('/tellers/applications/:id', admin_controller_1.approveRejectTeller);
router.get('/appointments', admin_controller_1.getAllAppointments);
// Financials
router.get('/financial-reports', admin_finance_controller_1.getFinancialReports);
// Reports / Complaints
router.get('/reports', admin_report_controller_1.getAllReports);
router.patch('/reports/:id/status', admin_report_controller_1.updateReportStatus);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map