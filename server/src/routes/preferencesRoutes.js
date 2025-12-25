import express from 'express';
import {
  getMyPreferences,
  updateMyPreferences,
} from '../controllers/preferencesController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

router.get('/me', getMyPreferences);
router.patch('/me', updateMyPreferences);

export default router;
