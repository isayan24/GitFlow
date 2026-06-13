import { Router } from 'express';

import authRouter from './authRoutes.js';
import githubRouter from './githubRoutes.js';
import repoRouter from './repoRoutes.js';
import dashboardRouter from './dashboardRoutes.js';
import webhookRouter from './webhookRoutes.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/github', githubRouter);
router.use('/repositories', repoRouter);
router.use('/dashboard', dashboardRouter);
router.use('/webhooks', webhookRouter);

export default router;
