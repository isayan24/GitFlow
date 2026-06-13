import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db.js";
import { IssueStatus, TaskType } from "@prisma/client";

/**
 * POST /api/webhooks/github
 * Accepts and processes GitHub Webhooks in real-time.
 */
export const handleGitHubWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const event = req.headers["x-github-event"] as string;
    const payload = req.body;

    const githubRepoId = payload.repository?.id;
    if (!githubRepoId) {
      res.status(400).json({
        status: "BAD_REQUEST",
        message: "Missing repository metadata in webhook payload.",
      });
      return;
    }

    // Check if we are tracking this repository in the database
    const localRepo = await prisma.repository.findUnique({
      where: { githubRepoId: Number(githubRepoId) },
    });

    // If the repository has not been imported, acknowledge with 200 and exit
    if (!localRepo) {
      res.status(200).json({
        status: "SUCCESS",
        message: "Webhook ignored. Repository is not imported/tracked in this workspace.",
      });
      return;
    }

    // Process event categories
    switch (event) {
      case "push":
        await handlePushEvent(localRepo.id, payload);
        break;
      case "issues":
        await handleIssueEvent(localRepo.id, payload);
        break;
      case "pull_request":
        await handlePullRequestEvent(localRepo.id, payload);
        break;
      default:
        console.log(`ℹ️ Webhook: received unhandled event category '${event}'.`);
    }

    res.status(200).json({ status: "SUCCESS" });
  } catch (err) {
    console.error("❌ Webhook processing failed:", err);
    next(err);
  }
};

// ─── Event Handlers ───────────────────────────────────────────────────────────

/**
 * Handle pushes: Increment commit heatmap counts in WeeklyCommitActivity
 */
async function handlePushEvent(repositoryId: string, payload: any): Promise<void> {
  const commits = payload.commits || [];
  if (commits.length === 0) return;

  for (const commit of commits) {
    const timestampStr = commit.timestamp;
    if (!timestampStr) continue;

    const date = new Date(timestampStr);
    const dateMs = date.getTime();
    const dayOfWeek = date.getUTCDay(); // 0 (Sun) - 6 (Sat)

    // Calculate week start timestamp (Sunday 00:00:00 UTC)
    const weekStartMs = Math.floor((dateMs - dayOfWeek * 86_400_000) / 1000) * 1000;
    const weekUnix = Math.floor(weekStartMs / 1000);

    const existingActivity = await prisma.weeklyCommitActivity.findUnique({
      where: {
        repositoryId_week: {
          repositoryId,
          week: weekUnix,
        },
      },
    });

    if (existingActivity) {
      const updatedDays = [...existingActivity.days];
      updatedDays[dayOfWeek] = (updatedDays[dayOfWeek] || 0) + 1;

      await prisma.weeklyCommitActivity.update({
        where: { id: existingActivity.id },
        data: {
          days: updatedDays,
          total: existingActivity.total + 1,
        },
      });
    } else {
      const days = [0, 0, 0, 0, 0, 0, 0];
      days[dayOfWeek] = 1;

      await prisma.weeklyCommitActivity.create({
        data: {
          week: weekUnix,
          days,
          total: 1,
          repositoryId,
        },
      });
    }
  }
  console.log(`✅ Webhook: updated commit activity heatmap with ${commits.length} commits.`);
}

/**
 * Handle issues: Create, update, close, or delete issue cards
 */
async function handleIssueEvent(repositoryId: string, payload: any): Promise<void> {
  const { action, issue } = payload;
  if (!issue) return;

  const githubNumber = Number(issue.number);

  if (action === "opened") {
    await prisma.issue.upsert({
      where: {
        repositoryId_githubNumber: {
          repositoryId,
          githubNumber,
        },
      },
      update: {
        title: issue.title,
        description: issue.body,
        status: issue.state === "closed" ? IssueStatus.CLOSED : IssueStatus.OPEN,
      },
      create: {
        title: issue.title,
        description: issue.body,
        status: issue.state === "closed" ? IssueStatus.CLOSED : IssueStatus.OPEN,
        type: TaskType.GITHUB_ISSUE,
        githubNumber,
        githubUrl: issue.html_url,
        repositoryId,
      },
    });
    console.log(`✅ Webhook: created issue #${githubNumber}.`);
  } else if (["closed", "reopened", "edited"].includes(action)) {
    await prisma.issue.updateMany({
      where: {
        repositoryId,
        githubNumber,
      },
      data: {
        title: issue.title,
        description: issue.body,
        status: issue.state === "closed" ? IssueStatus.CLOSED : IssueStatus.OPEN,
      },
    });
    console.log(`✅ Webhook: updated issue #${githubNumber} to state '${issue.state}'.`);
  } else if (action === "deleted") {
    await prisma.issue.deleteMany({
      where: {
        repositoryId,
        githubNumber,
      },
    });
    console.log(`✅ Webhook: deleted issue #${githubNumber}.`);
  }
}

/**
 * Handle PRs: Create or update pull request task cards
 */
async function handlePullRequestEvent(repositoryId: string, payload: any): Promise<void> {
  const { action, pull_request } = payload;
  if (!pull_request) return;

  const githubNumber = Number(pull_request.number);

  if (action === "opened") {
    await prisma.issue.upsert({
      where: {
        repositoryId_githubNumber: {
          repositoryId,
          githubNumber,
        },
      },
      update: {
        title: pull_request.title,
        description: pull_request.body,
        status: pull_request.state === "closed" ? IssueStatus.CLOSED : IssueStatus.OPEN,
      },
      create: {
        title: pull_request.title,
        description: pull_request.body,
        status: pull_request.state === "closed" ? IssueStatus.CLOSED : IssueStatus.OPEN,
        type: TaskType.GITHUB_PR,
        githubNumber,
        githubUrl: pull_request.html_url,
        repositoryId,
      },
    });
    console.log(`✅ Webhook: created PR #${githubNumber}.`);
  } else if (["closed", "reopened", "edited"].includes(action)) {
    await prisma.issue.updateMany({
      where: {
        repositoryId,
        githubNumber,
      },
      data: {
        title: pull_request.title,
        description: pull_request.body,
        status: pull_request.state === "closed" ? IssueStatus.CLOSED : IssueStatus.OPEN,
      },
    });
    console.log(`✅ Webhook: updated PR #${githubNumber} to state '${pull_request.state}'.`);
  }
}
