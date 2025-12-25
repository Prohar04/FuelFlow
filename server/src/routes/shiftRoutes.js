import express from 'express';
import {
  createShift,
  getShifts,
  getMyShifts,
  updateShift,
  deleteShift,
  checkConflicts,
  bulkCreateShifts,
  bulkPublishShifts,
  getUnpublishedShifts,
} from '../controllers/shiftController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Manager/Admin routes
router.post('/', requireRole('admin', 'manager'), createShift);
router.post('/check-conflicts', requireRole('admin', 'manager'), checkConflicts);
router.post('/bulk', requireRole('admin', 'manager'), bulkCreateShifts);
router.patch('/bulk-publish', requireRole('admin', 'manager'), bulkPublishShifts);
router.get('/unpublished', requireRole('admin', 'manager'), getUnpublishedShifts);
router.patch('/:id', requireRole('admin', 'manager'), updateShift);
router.delete('/:id', requireRole('admin', 'manager'), deleteShift);

// Get shifts (scoped by role)
router.get('/', getShifts);
router.get('/me', getMyShifts);

export default router;

