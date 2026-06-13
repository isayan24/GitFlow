import { Router } from "express";
import { verifyGitHubSignature } from "../middleware/webhookAuth.js";
import { handleGitHubWebhook } from "../controllers/webhookController.js";

const router = Router();

// POST /api/webhooks/github
router.post("/github", verifyGitHubSignature, handleGitHubWebhook);

export default router;
