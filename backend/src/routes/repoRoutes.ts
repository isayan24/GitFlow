import { Router } from 'express';
import { requireAuth, requireDbUser } from '../middleware/auth.js';
import { importRepository, listImportedRepos } from '../controllers/repoController.js';

const router = Router();

// POST /api/repositories/import
router.post('/import', requireAuth, requireDbUser, importRepository);

// GET /api/repositories
router.get('/', requireAuth, requireDbUser, listImportedRepos);

export default router;
