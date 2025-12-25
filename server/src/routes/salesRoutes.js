import express from 'express';
import {
  createSale,
  getSales,
  getSaleById,
} from '../controllers/salesController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Cashier routes
router.post('/', requireRole('admin', 'manager', 'cashier'), createSale);

// Get sales
router.get('/', getSales);
router.get('/:id', getSaleById);

export default router;
