import { Router } from 'express';
import { requireAuth, requireDbUser } from '../middleware/auth.js';
import { getDashboardStats } from '../controllers/dashboardController.js';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', requireAuth, requireDbUser, getDashboardStats);

export default router;
