import { clerkClient } from "@clerk/express";
import { prisma } from "../../config/db.js";
import { githubService } from "../githubService.js";
import {
  CommitInfo,
  DashboardStats,
  EMPTY_DASHBOARD_STATS,
  LeaderboardEntry,
} from "../../types/dashboard.types.js";
import {
  aggregateLanguages,
  aggregateCommitActivity,
} from "./languageService.js";
import { computeIssueMetrics } from "./issueService.js";
import {
  computeRadarProfile,
  computePunchCard,
  computeStreak,
  toUTCDateKey,
} from "./analyticsService.js";

// ─── Configuration ─────────────────────────────────────────────────────────────

/**
 * How far back (in days) to query GitHub for commits used in analytics
 * (streak, radar, punchcard, leaderboard).
 *
 * 90 days covers the longest realistic streak window while keeping
 * GitHub API response times manageable. Increase if users report very
 * long streaks still being truncated.
 */
const ANALYTICS_WINDOW_DAYS = 30;

async function getGitHubToken(clerkId: string): Promise<string | null> {
  try {
    const tokenResponse = await clerkClient.users.getUserOauthAccessToken(
      clerkId,
      "github",
    );
    return tokenResponse.data[0]?.token ?? null;
  } catch (err) {
    console.warn("⚠️ Clerk: failed to retrieve GitHub OAuth token:", err);
    return null;
  }
}

/**
 * Fetches commits from the last `ANALYTICS_WINDOW_DAYS` days for every
 * repository in parallel. Falls back to an empty array per repo on error
 * so a single inaccessible repo does not break the entire dashboard.
 */
async function fetchAllRepoCommits(
  githubToken: string,
  repositories: Array<{ id: string; name: string; owner: string }>,
): Promise<Array<{ repoId: string; repoName: string; rawCommits: any[] }>> {
  const sinceDate = new Date(
    Date.now() - ANALYTICS_WINDOW_DAYS * 86_400_000,
  ).toISOString();

  const results = await Promise.allSettled(
    repositories.map(async (repo) => {
      try {
        const rawCommits = await githubService.fetchCommitsSince(
          githubToken,
          repo.owner,
          repo.name,
          sinceDate,
        );
        return { repoId: repo.id, repoName: repo.name, rawCommits };
      } catch (err) {
        console.warn(
          `⚠️ GitHub: failed to fetch commits for ${repo.owner}/${repo.name}:`,
          err,
        );
        return { repoId: repo.id, repoName: repo.name, rawCommits: [] };
      }
    }),
  );

  return results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : { repoId: "", repoName: "", rawCommits: [] },
  );
}

/**
 * Normalizes raw GitHub commit API objects into typed `CommitInfo` records.
 * All date values are converted to UTC to ensure streak comparisons are correct.
 */
function normalizeCommits(rawCommits: any[]): CommitInfo[] {
  const commits: CommitInfo[] = [];

  for (const c of rawCommits) {
    const dateStr: string | undefined = c.commit?.author?.date;
    if (!dateStr) continue;

    const date = new Date(dateStr);
    commits.push({
      date,
      dateKey: toUTCDateKey(date),
      // Use UTC hour/day so punchCard is timezone-consistent with dateKey
      hour: date.getUTCHours(),
      day: date.getUTCDay(),
      message: (c.commit?.message as string) ?? "",
    });
  }

  return commits;
}

// ─── Public Service ────────────────────────────────────────────────────────────

/**
 * Orchestrates all data fetching and analytics computation for the dashboard.
 *
 * Responsibility split:
 *  - DB queries live here (single source of truth for data access)
 *  - Pure analytics computation is delegated to domain service modules
 *  - GitHub API calls are delegated to `githubService`
 */
export async function getDashboardData(
  dbUserId: string,
  clerkId: string,
): Promise<DashboardStats> {
  // ── 1. Load all user repositories from DB ──────────────────────────────────
  const repositories = await prisma.repository.findMany({
    where: { importedById: dbUserId },
    include: {
      commitActivity: true,
      issues: true,
    },
  });

  if (repositories.length === 0) {
    return EMPTY_DASHBOARD_STATS;
  }

  // ── 2. Aggregate DB-level stats (no GitHub API needed) ─────────────────────
  const languages = aggregateLanguages(repositories);
  const commitActivity = aggregateCommitActivity(repositories);
  const issues = computeIssueMetrics(repositories);

  // ── 3. GitHub API analytics (streak, radar, punchCard, leaderboard) ────────
  let radarProfile = EMPTY_DASHBOARD_STATS.radarProfile;
  let punchCard = EMPTY_DASHBOARD_STATS.punchCard;
  let streak = computeStreak([], commitActivity); // Initialize with DB commit activity (covers full 52 weeks)
  let leaderboard: LeaderboardEntry[] = [];

  const githubToken = await getGitHubToken(clerkId);

  if (githubToken) {
    try {
      const repoCommitBatches = await fetchAllRepoCommits(
        githubToken,
        repositories,
      );

      // Build leaderboard from per-repo commit counts
      leaderboard = repoCommitBatches
        .filter((b) => b.repoId) // filter out error stubs
        .map((b) => ({
          repoId: b.repoId,
          repoName: b.repoName,
          commits: b.rawCommits.length,
        }))
        .sort((a, b) => b.commits - a.commits);

      // Flatten and normalize all commits for cross-repo analytics
      const allCommits: CommitInfo[] = repoCommitBatches.flatMap((b) =>
        normalizeCommits(b.rawCommits),
      );

      // Sort newest-first (required by computeStreak)
      allCommits.sort((a, b) => b.date.getTime() - a.date.getTime());

      radarProfile = computeRadarProfile(allCommits);
      punchCard = computePunchCard(allCommits);
      streak = computeStreak(allCommits, commitActivity); // Update with both DB activity and real-time commits
    } catch (err) {
      console.error("⚠️ Dashboard: failed to compute GitHub analytics:", err);
      // Graceful degradation — return partial stats without crashing
    }
  }

  return {
    languages,
    commitActivity,
    issues,
    radarProfile,
    punchCard,
    streak,
    leaderboard,
  };
}
