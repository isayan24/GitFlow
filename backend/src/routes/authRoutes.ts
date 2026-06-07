import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { syncUser } from '../controllers/authController.js';

const router = Router();

// POST /api/auth/sync
router.post('/sync', requireAuth, syncUser);

export default router;
