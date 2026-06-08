import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { prisma } from "../config/db.js";
import { clerkClient } from "@clerk/express";
import { githubService } from "../services/githubService.js";
import { IssueStatus, ChecklistStatus, TaskType } from "@prisma/client";

/**
 * Creates a new Issue (which can be a GitHub issue or local manual issue)
 */
export const createIssue = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { repositoryId } = req.params;
    const { title, description, type, status } = req.body;
    const dbUserId = req.auth?.dbUser?.id;
    const clerkId = req.auth?.userId;

    if (!title) {
      return res.status(400).json({
        status: "BAD_REQUEST",
        message: "Issue title is required.",
      });
    }

    // Verify repository ownership
    const repo = await prisma.repository.findFirst({
      where: {
        id: repositoryId,
        importedById: dbUserId,
      },
    });

    if (!repo) {
      return res.status(404).json({
        status: "NOT_FOUND",
        message: "Repository not found or access denied.",
      });
    }

    let githubNumber: number | null = null;
    let githubUrl: string | null = null;
    const issueType = TaskType.GITHUB_ISSUE;

    // If type is GITHUB_ISSUE, create it on GitHub first
    if (issueType === TaskType.GITHUB_ISSUE) {
      const tokenResponse = await clerkClient.users.getUserOauthAccessToken(
        clerkId!,
        "github",
      );
      const githubToken = tokenResponse.data[0]?.token;

      if (!githubToken) {
        return res.status(400).json({
          status: "ERROR",
          message:
            "GitHub OAuth token not found. Please log in with GitHub to create issues.",
        });
      }

      let githubIssue;
      try {
        githubIssue = await githubService.createIssue(
          githubToken,
          repo.owner,
          repo.name,
          title,
          description || null,
        );
      } catch (err: any) {
        console.error("⚠️ Failed to create issue on GitHub:", err);
        return res.status(err.response?.status || 500).json({
          status: "ERROR",
          message: err.response?.data?.message || "Failed to create issue on GitHub. Please verify repository access permissions.",
        });
      }

      githubNumber = githubIssue.number;
      githubUrl = githubIssue.html_url;
    }

    const issue = await prisma.issue.create({
      data: {
        title,
        description,
        status: status || IssueStatus.OPEN,
        type: issueType,
        githubNumber,
        githubUrl,
        repositoryId,
      },
    });

    return res.status(201).json({
      status: "SUCCESS",
      issue,
    });
  } catch (error) {
    console.error("Error creating issue:", error);
    next(error);
  }
};

/**
 * Updates the status of an issue, closing/reopening on GitHub if synced
 */
export const updateIssueStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params; // Issue ID
    const { status } = req.body;
    const dbUserId = req.auth?.dbUser?.id;
    const clerkId = req.auth?.userId;

    if (!status || !Object.values(IssueStatus).includes(status)) {
      return res.status(400).json({
        status: "BAD_REQUEST",
        message: `Invalid status. Must be one of: ${Object.values(IssueStatus).join(", ")}`,
      });
    }

    // Verify issue ownership through repo
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: { repository: true },
    });

    if (!issue || issue.repository.importedById !== dbUserId) {
      return res.status(404).json({
        status: "NOT_FOUND",
        message: "Issue not found or access denied.",
      });
    }

    // If it's a GitHub Issue, close/reopen on GitHub when status changes to/from COMPLETED
    if (
      issue.type === TaskType.GITHUB_ISSUE &&
      issue.githubNumber &&
      issue.status !== status
    ) {
      const tokenResponse = await clerkClient.users.getUserOauthAccessToken(
        clerkId!,
        "github",
      );
      const githubToken = tokenResponse.data[0]?.token;

      if (githubToken) {
        try {
          const newGitHubState =
            status === IssueStatus.CLOSED ? "closed" : "open";
          console.log(
            `🐙 Syncing status change to GitHub for issue #${issue.githubNumber} -> ${newGitHubState}...`,
          );
          await githubService.updateIssueState(
            githubToken,
            issue.repository.owner,
            issue.repository.name,
            issue.githubNumber,
            newGitHubState,
          );
        } catch (err: any) {
          console.error("⚠️ Failed to update issue state on GitHub:", err);
          return res.status(err.response?.status || 500).json({
            status: "ERROR",
            message: err.response?.data?.message || "Failed to update issue status on GitHub. Please verify your repository access rights.",
          });
        }
      }
    }

    const updatedIssue = await prisma.issue.update({
      where: { id },
      data: { status: status as IssueStatus },
    });

    return res.status(200).json({
      status: "SUCCESS",
      issue: updatedIssue,
    });
  } catch (error) {
    console.error("Error updating issue status:", error);
    next(error);
  }
};

/**
 * Creates a checklist item (Checklist) under an Issue
 */
export const createChecklistItem = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params; // Issue ID
    const { title, description, imageUrl } = req.body;
    const dbUserId = req.auth?.dbUser?.id;

    if (!title) {
      return res.status(400).json({
        status: "BAD_REQUEST",
        message: "Checklist item title is required.",
      });
    }

    // Verify issue and repo ownership
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: { repository: true },
    });

    if (!issue || issue.repository.importedById !== dbUserId) {
      return res.status(404).json({
        status: "NOT_FOUND",
        message: "Issue not found or access denied.",
      });
    }

    const checklist = await prisma.checklist.create({
      data: {
        title,
        description,
        imageUrl,
        status: ChecklistStatus.PENDING,
        type: TaskType.MANUAL,
        issueId: id,
        repositoryId: issue.repositoryId,
      },
    });

    return res.status(201).json({
      status: "SUCCESS",
      subIssue: checklist, // Keep property name as subIssue or checklist? Let's return both or update the frontend accordingly. Let's return both to be safe or change to checklist. Let's return checklist and we'll update frontend to read checklist.
      checklist,
    });
  } catch (error) {
    console.error("Error creating checklist item:", error);
    next(error);
  }
};

/**
 * Updates a checklist item
 */
export const updateChecklistItem = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { checklistId } = req.params;
    const { status, title, description, imageUrl } = req.body;
    const dbUserId = req.auth?.dbUser?.id;

    const checklist = await prisma.checklist.findUnique({
      where: { id: checklistId },
      include: { repository: true },
    });

    if (!checklist || checklist.repository.importedById !== dbUserId) {
      return res.status(404).json({
        status: "NOT_FOUND",
        message: "Checklist item not found or access denied.",
      });
    }

    const updatedChecklist = await prisma.checklist.update({
      where: { id: checklistId },
      data: {
        status: status ? (status as ChecklistStatus) : undefined,
        title: title || undefined,
        description: description !== undefined ? description : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
      },
    });

    return res.status(200).json({
      status: "SUCCESS",
      subIssue: updatedChecklist, // compat fallback
      checklist: updatedChecklist,
    });
  } catch (error) {
    console.error("Error updating checklist item:", error);
    next(error);
  }
};

/**
 * Deletes a checklist item
 */
export const deleteChecklistItem = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { checklistId } = req.params;
    const dbUserId = req.auth?.dbUser?.id;

    const checklist = await prisma.checklist.findUnique({
      where: { id: checklistId },
      include: { repository: true },
    });

    if (!checklist || checklist.repository.importedById !== dbUserId) {
      return res.status(404).json({
        status: "NOT_FOUND",
        message: "Checklist item not found or access denied.",
      });
    }

    await prisma.checklist.delete({
      where: { id: checklistId },
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: "Checklist item deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting checklist item:", error);
    next(error);
  }
};
