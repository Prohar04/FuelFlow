import express from 'express';
import {
  getCurrentPrices,
  createPrice,
  getPriceHistory,
} from '../controllers/priceController.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public route for current prices
router.get('/current', optionalAuth, getCurrentPrices);

// Admin only routes
router.post('/', requireAuth, requireRole('admin'), createPrice);
router.get('/history', requireAuth, requireRole('admin'), getPriceHistory);

export default router;
