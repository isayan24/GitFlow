import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { prisma } from "../config/db.js";
import { clerkClient } from "@clerk/express";
import { githubService } from "../services/githubService.js";
import { IssueStatus, ChecklistStatus, TaskType } from "@prisma/client";

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
            checklists: true,
            issues: true,
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
      const githubIssues = await githubService.fetchRepoIssues(
        githubToken,
        owner,
        name,
      );
      const mappedIssues = githubIssues.map((issue) => ({
        title: issue.title,
        description: issue.body,
        status:
          issue.state === "closed" ? IssueStatus.CLOSED : IssueStatus.OPEN,
        type: issue.pull_request ? TaskType.GITHUB_PR : TaskType.GITHUB_ISSUE,
        githubNumber: issue.number,
        githubUrl: issue.html_url,
        repositoryId: repository.id,
      }));

      if (mappedIssues.length > 0) {
        await prisma.issue.createMany({ data: mappedIssues });
        console.log(`✅ Imported ${mappedIssues.length} GitHub issues.`);
      }
    } catch (err) {
      console.error("⚠️ Failed to import GitHub issues:", err);
    }

    // 2. Fetch & import commit activity
    try {
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
        checklists: {
          orderBy: { createdAt: "desc" },
        },
        issues: {
          include: {
            checklists: true,
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
 * Synchronizes a repository with GitHub: fetches latest issues, PRs, and commit activity.
 * If the repository is deleted or inaccessible on GitHub (404), deletes it locally and returns status DELETED.
 */
export const syncRepository = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const dbUserId = req.auth?.dbUser?.id;
    const clerkId = req.auth?.userId;

    // 1. Fetch repository from DB
    const repository = await prisma.repository.findFirst({
      where: {
        id,
        importedById: dbUserId,
      },
    });

    if (!repository) {
      return res.status(404).json({
        status: "NOT_FOUND",
        message: "Repository not found or access denied.",
      });
    }

    // 2. Fetch GitHub Token from Clerk connection
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

    // 3. Verify repository exists on GitHub
    try {
      await githubService.fetchRepoMetadata(
        githubToken,
        repository.owner,
        repository.name,
      );
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn(
          `⚠️ Repository ${repository.owner}/${repository.name} not found on GitHub. Auto-deleting from local DB.`,
        );
        // Cascade delete will clean up tasks and activities automatically
        await prisma.repository.delete({
          where: { id: repository.id },
        });

        return res.status(200).json({
          status: "DELETED",
          message:
            "Repository has been deleted or is no longer accessible on GitHub.",
        });
      }
      throw error;
    }

    // 4. Sync issues/PRs into Issues
    try {
      console.log(
        `🔄 Syncing issues/PRs from GitHub for ${repository.owner}/${repository.name}...`,
      );
      const githubIssues = await githubService.fetchRepoIssues(
        githubToken,
        repository.owner,
        repository.name,
      );

      const existingIssues = await prisma.issue.findMany({
        where: {
          repositoryId: repository.id,
          githubNumber: { not: null },
        },
      });

      const issueMap = new Map(existingIssues.map((i) => [i.githubNumber, i]));

      for (const githubIssue of githubIssues) {
        const existingIssue = issueMap.get(githubIssue.number);

        if (existingIssue) {
          // Update existing issue
          const newStatus =
            githubIssue.state === "closed"
              ? IssueStatus.CLOSED
              : existingIssue.status === IssueStatus.CLOSED
                ? IssueStatus.OPEN
                : existingIssue.status;

          await prisma.issue.update({
            where: { id: existingIssue.id },
            data: {
              title: githubIssue.title,
              description: githubIssue.body,
              status: newStatus,
              type: githubIssue.pull_request
                ? TaskType.GITHUB_PR
                : TaskType.GITHUB_ISSUE,
              githubUrl: githubIssue.html_url,
            },
          });
        } else {
          // Create new issue
          await prisma.issue.create({
            data: {
              title: githubIssue.title,
              description: githubIssue.body,
              status:
                githubIssue.state === "closed"
                  ? IssueStatus.CLOSED
                  : IssueStatus.OPEN,
              type: githubIssue.pull_request
                ? TaskType.GITHUB_PR
                : TaskType.GITHUB_ISSUE,
              githubNumber: githubIssue.number,
              githubUrl: githubIssue.html_url,
              repositoryId: repository.id,
            },
          });
        }
      }
      console.log(`✅ Synced ${githubIssues.length} issues/PRs to Issues.`);
    } catch (err) {
      console.error("⚠️ Failed to sync GitHub issues:", err);
    }

    // 5. Sync commit activity
    try {
      console.log(
        `🔄 Syncing commit activity from GitHub for ${repository.owner}/${repository.name}...`,
      );
      const githubCommits = await githubService.fetchRepoCommitActivity(
        githubToken,
        repository.owner,
        repository.name,
      );

      for (const item of githubCommits) {
        await prisma.weeklyCommitActivity.upsert({
          where: {
            repositoryId_week: {
              repositoryId: repository.id,
              week: item.week,
            },
          },
          update: {
            days: item.days,
            total: item.total,
          },
          create: {
            week: item.week,
            days: item.days,
            total: item.total,
            repositoryId: repository.id,
          },
        });
      }
      console.log(`✅ Synced commit activity.`);
    } catch (err) {
      console.error("⚠️ Failed to sync GitHub commit activity:", err);
    }

    // Return the updated repository details
    const updatedRepository = await prisma.repository.findUnique({
      where: { id: repository.id },
      include: {
        checklists: {
          orderBy: { createdAt: "desc" },
        },
        issues: {
          include: {
            checklists: true,
          },
          orderBy: { createdAt: "desc" },
        },
        commitActivity: {
          orderBy: { week: "asc" },
        },
      },
    });

    console.log(updatedRepository, "updatedRepository");

    return res.status(200).json({
      status: "SUCCESS",
      message: "Repository sync completed successfully.",
      repository: updatedRepository,
    });
  } catch (error) {
    console.error("Error syncing repository:", error);
    next(error);
  }
};
