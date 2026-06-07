import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { prisma } from "../config/db.js";
import { clerkClient } from "@clerk/express";
import { githubService } from "../services/githubService.js";
import { TaskStatus, TaskType } from "@prisma/client";

/**
 * Lists all projects (repositories) imported by the authenticated user
 */
export const listImportedRepos = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.auth?.dbUser?.id;

    const repos = await prisma.repository.findMany({
      where: { importedById: userId },
      include: {
        _count: {
          select: {
            tasks: true,
            assignments: true,
          },
        },
        commitActivity: {
          orderBy: { week: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return res.status(200).json({
      status: "SUCCESS",
      repositories: repos,
    });
  } catch (error) {
    console.error("Error listing imported repositories:", error);
    next(error);
  }
};

/**
 * Imports a GitHub repository, fetching and caching its Issues, PRs, and commit activity
 */
export const importRepository = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { githubRepoId, name, owner, description, url, isPrivate, imageUrl } =
      req.body;
    const dbUserId = req.auth?.dbUser?.id;
    const clerkId = req.auth?.userId;

    console.log(req.body, "*** importing repo ***");

    if (!githubRepoId || !name || !owner || !url) {
      return res.status(400).json({
        status: "BAD_REQUEST",
        message:
          "Missing required repository fields: githubRepoId, name, owner, and url are required.",
      });
    }

    // Check if the repository was already imported
    const existingRepo = await prisma.repository.findUnique({
      where: { githubRepoId: Number(githubRepoId) },
    });

    if (existingRepo) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Repository has already been imported.",
        repository: existingRepo,
      });
    }

    // Create repository record in DB
    console.log(
      `📦 Registering repository record in PostgreSQL: ${owner}/${name}`,
    );
    const repository = await prisma.repository.create({
      data: {
        githubRepoId: Number(githubRepoId),
        name,
        owner,
        description,
        url,
        isPrivate: Boolean(isPrivate),
        imageUrl,
        importedById: dbUserId,
      },
    });

    // Fetch GitHub Token from Clerk connection
    console.log(
      `🔑 Fetching GitHub token from Clerk to sync: ${owner}/${name}`,
    );
    const tokenResponse = await clerkClient.users.getUserOauthAccessToken(
      clerkId!,
      "github",
    );
    const githubToken = tokenResponse.data[0]?.token;

    if (!githubToken) {
      return res.status(400).json({
        status: "ERROR",
        message:
          "GitHub OAuth token not found. Please log in with GitHub to perform syncs.",
      });
    }

    // 1. Fetch & import issues and PRs (Max 100)
    try {
      console.log(`🐙 Fetching issues/PRs from GitHub for ${owner}/${name}...`);
      const githubIssues = await githubService.fetchRepoIssues(
        githubToken,
        owner,
        name,
      );
      const mappedTasks = githubIssues.map((issue) => ({
        title: issue.title,
        description: issue.body,
        status:
          issue.state === "closed" ? TaskStatus.COMPLETED : TaskStatus.TODO,
        type: issue.pull_request ? TaskType.GITHUB_PR : TaskType.GITHUB_ISSUE,
        githubNumber: issue.number,
        githubUrl: issue.html_url,
        repositoryId: repository.id,
      }));

      if (mappedTasks.length > 0) {
        await prisma.task.createMany({ data: mappedTasks });
        console.log(`✅ Imported ${mappedTasks.length} GitHub tasks.`);
      }
    } catch (err) {
      console.error("⚠️ Failed to import GitHub issues:", err);
    }

    // 2. Fetch & import commit activity
    try {
      console.log(
        `🐙 Fetching commit activity statistics from GitHub for ${owner}/${name}...`,
      );
      const githubCommits = await githubService.fetchRepoCommitActivity(
        githubToken,
        owner,
        name,
      );
      const mappedCommits = githubCommits.map((item) => ({
        week: item.week,
        days: item.days,
        total: item.total,
        repositoryId: repository.id,
      }));

      if (mappedCommits.length > 0) {
        await prisma.weeklyCommitActivity.createMany({ data: mappedCommits });
        console.log(
          `✅ Imported ${mappedCommits.length} weeks of commit activity.`,
        );
      }
    } catch (err) {
      console.error("⚠️ Failed to import GitHub commit activity:", err);
    }

    return res.status(201).json({
      status: "SUCCESS",
      message: "Repository and assets imported successfully.",
      repository,
    });
  } catch (error) {
    console.error("Error importing repository:", error);
    next(error);
  }
};

/**
 * Fetches full details for a specific repository (including tasks, assignments, and commit activity)
 */
export const getRepositoryDetails = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const dbUserId = req.auth?.dbUser?.id;

    const repository = await prisma.repository.findFirst({
      where: {
        id,
        importedById: dbUserId,
      },
      include: {
        tasks: {
          orderBy: { createdAt: "desc" },
        },
        assignments: {
          include: {
            tasks: true,
          },
          orderBy: { createdAt: "desc" },
        },
        commitActivity: {
          orderBy: { week: "asc" },
        },
      },
    });

    if (!repository) {
      return res.status(404).json({
        status: "NOT_FOUND",
        message: "Repository not found or access denied.",
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      repository,
    });
  } catch (error) {
    console.error("Error getting repository details:", error);
    next(error);
  }
};

/**
 * Updates the status of a specific task
 */
export const updateTaskStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const dbUserId = req.auth?.dbUser?.id;

    if (!status || !Object.values(TaskStatus).includes(status)) {
      return res.status(400).json({
        status: "BAD_REQUEST",
        message: `Invalid or missing status. Must be one of: ${Object.values(TaskStatus).join(", ")}`,
      });
    }

    // Verify task ownership through repository import association
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { repository: true },
    });

    if (!task || task.repository.importedById !== dbUserId) {
      return res.status(404).json({
        status: "NOT_FOUND",
        message: "Task not found or access denied.",
      });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: status as TaskStatus },
    });

    return res.status(200).json({
      status: "SUCCESS",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Error updating task status:", error);
    next(error);
  }
};

/**
 * Creates a manual task inside a repository
 */
export const createTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params; // Repository internal ID
    const { title, description, status } = req.body;
    const dbUserId = req.auth?.dbUser?.id;

    if (!title) {
      return res.status(400).json({
        status: "BAD_REQUEST",
        message: "Task title is required.",
      });
    }

    // Verify repository ownership
    const repo = await prisma.repository.findFirst({
      where: {
        id,
        importedById: dbUserId,
      },
    });

    if (!repo) {
      return res.status(404).json({
        status: "NOT_FOUND",
        message: "Repository not found or access denied.",
      });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: (status as TaskStatus) || TaskStatus.TODO,
        type: TaskType.MANUAL,
        repositoryId: id,
      },
    });

    return res.status(201).json({
      status: "SUCCESS",
      task,
    });
  } catch (error) {
    console.error("Error creating manual task:", error);
    next(error);
  }
};
