import express from 'express';
import {
  getInventory,
  createStockIn,
  createAdjustment,
  getInventoryLedger,
  setLowStockThreshold,
} from '../controllers/inventoryController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Manager routes
router.post('/stock-in', requireRole('admin', 'manager'), createStockIn);
router.post('/adjustment', requireRole('admin', 'manager'), createAdjustment);
router.post('/threshold', requireRole('admin', 'manager'), setLowStockThreshold);

// Get inventory
router.get('/', requireRole('admin', 'manager', 'cashier'), getInventory);
router.get('/ledger', requireRole('admin', 'manager'), getInventoryLedger);

export default router;
