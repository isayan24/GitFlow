import { Router } from 'express';

import authRouter from './authRoutes.js';
import githubRouter from './githubRoutes.js';
import repoRouter from './repoRoutes.js';
import dashboardRouter from './dashboardRoutes.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/github', githubRouter);
router.use('/repositories', repoRouter);
router.use('/dashboard', dashboardRouter);

export default router;
