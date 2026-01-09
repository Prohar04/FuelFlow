import express from 'express';
import {
  createSchedulePeriod,
  getSchedulePeriods,
  publishSchedulePeriod,
  unpublishSchedulePeriod,
} from '../controllers/schedulePeriodController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and manager/admin role
router.use(requireAuth);
router.use(requireRole('admin', 'manager'));

// Schedule period routes
router.post('/', createSchedulePeriod);
router.get('/', getSchedulePeriods);
router.post('/:id/publish', publishSchedulePeriod);
router.post('/:id/unpublish', requireRole('admin'), unpublishSchedulePeriod); // Admin only

export default router;
