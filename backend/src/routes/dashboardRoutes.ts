import { Router } from 'express';
import { requireAuth, requireDbUser } from '../middleware/auth.js';
import { getDashboardStats, getDashboardCommits } from '../controllers/dashboardController.js';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', requireAuth, requireDbUser, getDashboardStats);

// GET /api/dashboard/commits (commits across all user repositories on a given date)
router.get('/commits', requireAuth, requireDbUser, getDashboardCommits);

export default router;
