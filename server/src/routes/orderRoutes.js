import express from 'express';
import {
  createOrder,
  getOrders,
  updateOrderStatus,
  getOrderInvoice,
} from '../controllers/orderController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and manager/admin role
router.use(requireAuth);
router.use(requireRole('admin', 'manager'));

router.post('/', createOrder);
router.get('/', getOrders);
router.patch('/:id/status', updateOrderStatus);
router.get('/:id/invoice', getOrderInvoice);

export default router;
