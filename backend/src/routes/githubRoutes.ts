import { Router } from 'express';
import { requireAuth, requireDbUser } from '../middleware/auth.js';
import { listUserRepos } from '../controllers/githubController.js';

const router = Router();

// GET /api/github/repos
router.get('/repos', requireAuth, requireDbUser, listUserRepos);

export default router;
