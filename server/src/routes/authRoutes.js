import express from 'express';
import {
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Authenticated routes
router.post('/change-password', requireAuth, changePassword);

export default router;
