import express from 'express';
import {
  generateWeeklyPayrollController,
  markPayrollAsGiven,
  getPayrollSummaryController,
  getPayroll,
  getMyPayroll,
  getPayslip,
} from '../controllers/payrollController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Manager/Admin routes
router.post('/generate-weekly', requireRole('admin', 'manager'), generateWeeklyPayrollController);
router.patch('/:id/mark-given', requireRole('admin', 'manager'), markPayrollAsGiven);
router.get('/summary', requireRole('admin', 'manager'), getPayrollSummaryController);

// Get payroll
router.get('/', getPayroll);
router.get('/me', getMyPayroll);
router.get('/:id/payslip', getPayslip);

export default router;
