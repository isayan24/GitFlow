import { IssueMetrics } from "../../types/dashboard.types.js";
import { IssueStatus } from "@prisma/client";

type RepositoryWithIssues = {
  issues: Array<{
    status: IssueStatus;
    createdAt: Date;
    updatedAt: Date;
  }>;
};

/**
 * Computes open/closed issue counts and average resolution time
 * across all repositories owned by the user.
 */
export function computeIssueMetrics(
  repositories: RepositoryWithIssues[],
): IssueMetrics {
  let openIssues = 0;
  let closedIssues = 0;
  let totalResolutionTimeMs = 0;
  let resolvedIssuesCount = 0;

  for (const repo of repositories) {
    for (const issue of repo.issues) {
      if (issue.status === IssueStatus.CLOSED) {
        closedIssues++;
        const duration =
          new Date(issue.updatedAt).getTime() -
          new Date(issue.createdAt).getTime();
        if (duration >= 0) {
          totalResolutionTimeMs += duration;
          resolvedIssuesCount++;
        }
      } else {
        openIssues++;
      }
    }
  }

  const avgResolutionDays =
    resolvedIssuesCount > 0
      ? Number(
          (
            totalResolutionTimeMs /
            (1000 * 60 * 60 * 24) /
            resolvedIssuesCount
          ).toFixed(1),
        )
      : 0;

  return {
    open: openIssues,
    closed: closedIssues,
    avgResolutionDays,
  };
}
