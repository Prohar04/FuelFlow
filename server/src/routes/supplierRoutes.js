import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} from '../controllers/supplierController.js';

const router = express.Router();

// All routes require authentication and manager/admin role
router.use(requireAuth);
router.use(requireRole('admin', 'manager'));

// Create supplier
router.post('/', createSupplier);

// Get all suppliers (with search and filter)
router.get('/', getSuppliers);

// Get supplier by ID
router.get('/:id', getSupplierById);

// Update supplier
router.put('/:id', updateSupplier);

// Delete supplier (admin only)
router.delete('/:id', requireRole('admin'), deleteSupplier);

export default router;
