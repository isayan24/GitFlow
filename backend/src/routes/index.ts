import { Router } from 'express';

import authRouter from './authRoutes.js';
import githubRouter from './githubRoutes.js';
import repoRouter from './repoRoutes.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/github', githubRouter);
router.use('/repositories', repoRouter);

export default router;
