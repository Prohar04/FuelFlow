import express from 'express';
import {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
} from '../controllers/shiftTemplateController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Manager/Admin routes
router.post('/', requireRole('admin', 'manager'), createTemplate);
router.get('/', requireRole('admin', 'manager'), getTemplates);
router.get('/:id', requireRole('admin', 'manager'), getTemplateById);
router.patch('/:id', requireRole('admin', 'manager'), updateTemplate);
router.delete('/:id', requireRole('admin', 'manager'), deleteTemplate);

export default router;
