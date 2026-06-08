import { Router } from 'express';
import { requireAuth, requireDbUser } from '../middleware/auth.js';
import { 
  importRepository, 
  listImportedRepos, 
  getRepositoryDetails, 
  syncRepository
} from '../controllers/repoController.js';
import {
  createIssue,
  updateIssueStatus,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem
} from '../controllers/issueController.js';

const router = Router();

// POST /api/repositories/import
router.post('/import', requireAuth, requireDbUser, importRepository);

// GET /api/repositories
router.get('/', requireAuth, requireDbUser, listImportedRepos);

// GET /api/repositories/:id (Details: tasks, commits, assignments)
router.get('/:id', requireAuth, requireDbUser, getRepositoryDetails);

// POST /api/repositories/:id/sync
router.post('/:id/sync', requireAuth, requireDbUser, syncRepository);

// POST /api/repositories/:repositoryId/issues (Create issue)
router.post('/:repositoryId/issues', requireAuth, requireDbUser, createIssue);

// PATCH /api/repositories/issues/:id/status (Update issue status)
router.patch('/issues/:id/status', requireAuth, requireDbUser, updateIssueStatus);

// POST /api/repositories/issues/:id/checklists (Create checklist item)
router.post('/issues/:id/checklists', requireAuth, requireDbUser, createChecklistItem);

// PATCH /api/repositories/checklists/:checklistId (Update checklist item)
router.patch('/checklists/:checklistId', requireAuth, requireDbUser, updateChecklistItem);

// DELETE /api/repositories/checklists/:checklistId (Delete checklist item)
router.delete('/checklists/:checklistId', requireAuth, requireDbUser, deleteChecklistItem);

export default router;
