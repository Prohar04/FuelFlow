import express from 'express';
import {
  createPump,
  getPumps,
  getPumpById,
  updatePump,
  terminatePump,
} from '../controllers/pumpController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Admin only routes
router.post('/', requireRole('admin'), createPump);
router.patch('/:id', requireRole('admin'), updatePump);
router.post('/:id/terminate', requireRole('admin'), terminatePump);

// Admin and Manager routes
router.get('/', requireRole('admin', 'manager'), getPumps);
router.get('/:id', requireRole('admin', 'manager'), getPumpById);

export default router;
