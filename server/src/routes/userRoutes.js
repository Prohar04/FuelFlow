import express from 'express';
import {
  createUser,
  getUsers,
  getCurrentUser,
  getUserById,
  updateUser,
  terminateUser,
  reinstateUser,
} from '../controllers/userController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Get current user (all authenticated users)
router.get('/me', getCurrentUser);

// Admin and Manager routes
router.post('/', requireRole('admin', 'manager'), createUser);
router.get('/', requireRole('admin', 'manager'), getUsers);

// Get, update, terminate user
router.get('/:id', getUserById);
router.patch('/:id', requireRole('admin', 'manager'), updateUser);
router.post('/:id/terminate', requireRole('admin', 'manager'), terminateUser);
router.post('/:id/reinstate', requireRole('admin', 'manager'), reinstateUser);

export default router;
