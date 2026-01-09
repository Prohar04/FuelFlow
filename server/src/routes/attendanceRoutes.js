import express from 'express';
import {
  createAttendance,
  getAttendance,
  getMyAttendance,
} from '../controllers/attendanceController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Manager routes
router.post('/', requireRole('admin', 'manager'), createAttendance);
router.get('/', getAttendance);

// Employee routes
router.get('/me', getMyAttendance);

export default router;
