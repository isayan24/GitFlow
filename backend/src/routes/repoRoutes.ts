import { Router } from 'express';
import { requireAuth, requireDbUser } from '../middleware/auth.js';
import { 
  importRepository, 
  listImportedRepos, 
  getRepositoryDetails, 
  updateTaskStatus, 
  createTask 
} from '../controllers/repoController.js';

const router = Router();

// POST /api/repositories/import
router.post('/import', requireAuth, requireDbUser, importRepository);

// GET /api/repositories
router.get('/', requireAuth, requireDbUser, listImportedRepos);

// GET /api/repositories/:id (Details: tasks, commits, assignments)
router.get('/:id', requireAuth, requireDbUser, getRepositoryDetails);

// PATCH /api/repositories/tasks/:taskId (Update status)
router.patch('/tasks/:taskId', requireAuth, requireDbUser, updateTaskStatus);

// POST /api/repositories/:id/tasks (Create manual task)
router.post('/:id/tasks', requireAuth, requireDbUser, createTask);

export default router;
