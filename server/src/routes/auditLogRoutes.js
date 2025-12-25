import express from 'express';
import { getAuditLogsController } from '../controllers/auditLogController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and manager/admin role
router.use(requireAuth);
router.use(requireRole('admin', 'manager'));

// Audit log routes
router.get('/', getAuditLogsController);

export default router;
