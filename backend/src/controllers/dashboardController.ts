import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { prisma } from "../config/db.js";
import { clerkClient } from "@clerk/express";
import { githubService } from "../services/githubService.js";
import { IssueStatus } from "@prisma/client";

/**
 * Parses a date in local timezone to YYYY-MM-DD
 */
const formatDateKey = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Aggregates and returns developer performance statistics across all imported repositories
 */
export const getDashboardStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const dbUserId = req.auth?.dbUser?.id;
    const clerkId = req.auth?.userId;

    if (!dbUserId) {
      return res.status(401).json({
        status: "UNAUTHORIZED",
        message: "User not authenticated.",
      });
    }

    // 1. Fetch all repositories owned/imported by this user
    const repositories = await prisma.repository.findMany({
      where: { importedById: dbUserId },
      include: {
        commitActivity: true,
        issues: true,
      },
    });

    if (repositories.length === 0) {
      return res.status(200).json({
        status: "SUCCESS",
        stats: {
          languages: {},
          commitActivity: [],
          issues: { open: 0, closed: 0, avgResolutionDays: 0 },
          radarProfile: {
            feature: 0,
            fix: 0,
            refactor: 0,
            test: 0,
            docs: 0,
            chore: 0,
          },
          punchCard: [],
          streak: { current: 0, longest: 0 },
          leaderboard: [],
        },
      });
    }

    // 2. Aggregate Languages
    const globalLangs: Record<string, number> = {};
    repositories.forEach((repo) => {
      if (repo.languages && typeof repo.languages === "object") {
        const langs = repo.languages as Record<string, number>;
        Object.entries(langs).forEach(([name, bytes]) => {
          globalLangs[name] = (globalLangs[name] || 0) + bytes;
        });
      }
    });

    // 3. Aggregate Commit Activity Heatmap
    // Group weekly activity across all repositories by the 'week' unix timestamp
    const weeklyMap: Record<number, number[]> = {};
    repositories.forEach((repo) => {
      repo.commitActivity.forEach((act) => {
        if (!weeklyMap[act.week]) {
          weeklyMap[act.week] = [0, 0, 0, 0, 0, 0, 0];
        }
        for (let i = 0; i < 7; i++) {
          weeklyMap[act.week][i] += act.days[i] || 0;
        }
      });
    });

    const aggregatedCommitActivity = Object.entries(weeklyMap)
      .map(([weekStr, days]) => {
        const week = Number(weekStr);
        const total = days.reduce((sum, val) => sum + val, 0);
        return {
          week,
          days,
          total,
        };
      })
      .sort((a, b) => a.week - b.week);

    // 4. Issues & PRs Metrics
    let openIssues = 0;
    let closedIssues = 0;
    let totalResolutionTimeMs = 0;
    let resolvedIssuesCount = 0;

    repositories.forEach((repo) => {
      repo.issues.forEach((issue) => {
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
      });
    });

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

    const issuesStats = {
      open: openIssues,
      closed: closedIssues,
      avgResolutionDays,
    };

    // 5. Fetch GitHub OAuth Token from Clerk to query recent commits
    let githubToken: string | null = null;
    try {
      const tokenResponse = await clerkClient.users.getUserOauthAccessToken(
        clerkId!,
        "github",
      );
      githubToken = tokenResponse.data[0]?.token || null;
    } catch (err) {
      console.error("⚠️ Clerk failed to get GitHub OAuth token:", err);
    }

    // Initial default analytics in case we cannot fetch commits
    let radarProfile = {
      feature: 0,
      fix: 0,
      refactor: 0,
      test: 0,
      docs: 0,
      chore: 0,
    };
    let punchCard: { day: number; hour: number; count: number }[] = [];
    let streakStats = { current: 0, longest: 0 };
    let leaderboard: {
      repoId: string;
      repoName: string;
      commits: number;
      color?: string;
    }[] = [];

    if (githubToken) {
      try {
        // Fetch last 30 commits for all repositories in parallel
        const allCommitsPromises = repositories.map(async (repo) => {
          try {
            const rawCommits = await githubService.fetchRecentCommits(
              githubToken!,
              repo.owner,
              repo.name,
              30,
            );
            return {
              repoId: repo.id,
              repoName: repo.name,
              commits: rawCommits,
            };
          } catch (e) {
            console.error(
              `⚠️ Failed to fetch recent commits for ${repo.owner}/${repo.name}:`,
              e,
            );
            return { repoId: repo.id, repoName: repo.name, commits: [] };
          }
        });

        const reposCommits = await Promise.all(allCommitsPromises);

        // Leaderboard calculations
        leaderboard = reposCommits
          .map((rc) => ({
            repoId: rc.repoId,
            repoName: rc.repoName,
            commits: rc.commits.length,
          }))
          .sort((a, b) => b.commits - a.commits);

        // Flatten all commits and extract details
        interface LocalCommitInfo {
          date: Date;
          dateStr: string;
          hour: number;
          day: number;
          message: string;
        }
        const flattenedCommits: LocalCommitInfo[] = [];

        reposCommits.forEach((rc) => {
          rc.commits.forEach((c: any) => {
            if (c.commit?.author?.date) {
              const commitDate = new Date(c.commit.author.date);
              flattenedCommits.push({
                date: commitDate,
                dateStr: formatDateKey(commitDate),
                hour: commitDate.getHours(),
                day: commitDate.getDay(),
                message: c.commit.message || "",
              });
            }
          });
        });

        // Sort commits chronologically descending (newest first)
        flattenedCommits.sort((a, b) => b.date.getTime() - a.date.getTime());

        // A. Semantic Radar Profile
        let featCount = 0;
        let fixCount = 0;
        let refactorCount = 0;
        let testCount = 0;
        let docsCount = 0;
        let choreCount = 0;

        flattenedCommits.forEach((c) => {
          const msg = c.message.toLowerCase();
          if (
            msg.includes("feat") ||
            msg.includes("add") ||
            msg.includes("implement") ||
            msg.includes("create")
          ) {
            featCount++;
          } else if (
            msg.includes("fix") ||
            msg.includes("bug") ||
            msg.includes("issue") ||
            msg.includes("resolve")
          ) {
            fixCount++;
          } else if (
            msg.includes("refactor") ||
            msg.includes("perf") ||
            msg.includes("optimize") ||
            msg.includes("clean")
          ) {
            refactorCount++;
          } else if (
            msg.includes("test") ||
            msg.includes("spec") ||
            msg.includes("coverage")
          ) {
            testCount++;
          } else if (
            msg.includes("docs") ||
            msg.includes("readme") ||
            msg.includes("comment")
          ) {
            docsCount++;
          } else {
            choreCount++;
          }
        });

        const totalCommitTags =
          featCount +
          fixCount +
          refactorCount +
          testCount +
          docsCount +
          choreCount;
        if (totalCommitTags > 0) {
          radarProfile = {
            feature: Math.round((featCount / totalCommitTags) * 100),
            fix: Math.round((fixCount / totalCommitTags) * 100),
            refactor: Math.round((refactorCount / totalCommitTags) * 100),
            test: Math.round((testCount / totalCommitTags) * 100),
            docs: Math.round((docsCount / totalCommitTags) * 100),
            chore: Math.round((choreCount / totalCommitTags) * 100),
          };
        }

        // B. Hourly/Weekly Punch Card (Day, Hour)
        const punchMap: Record<string, number> = {};
        flattenedCommits.forEach((c) => {
          const key = `${c.day}-${c.hour}`;
          punchMap[key] = (punchMap[key] || 0) + 1;
        });

        punchCard = [];
        for (let d = 0; d < 7; d++) {
          for (let h = 0; h < 24; h++) {
            const count = punchMap[`${d}-${h}`] || 0;
            if (count > 0) {
              punchCard.push({ day: d, hour: h, count });
            }
          }
        }

        // C. Streak Tracking
        const uniqueActiveDates = Array.from(
          new Set(flattenedCommits.map((c) => c.dateStr)),
        ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // Descending (newest first)

        if (uniqueActiveDates.length > 0) {
          let currentStreak = 0;
          let longestStreak = 0;
          let tempStreak = 0;

          // Today & Yesterday formatted strings
          const todayStr = formatDateKey(new Date());
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = formatDateKey(yesterday);

          // Calculate current streak (must contain today or yesterday to be active)
          const hasActivityRecently =
            uniqueActiveDates[0] === todayStr ||
            uniqueActiveDates[0] === yesterdayStr;

          if (hasActivityRecently) {
            let lastDate = new Date(uniqueActiveDates[0]);
            currentStreak = 1;

            for (let i = 1; i < uniqueActiveDates.length; i++) {
              const currentDate = new Date(uniqueActiveDates[i]);
              const diffTime = lastDate.getTime() - currentDate.getTime();
              const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

              if (diffDays === 1) {
                currentStreak++;
                lastDate = currentDate;
              } else if (diffDays > 1) {
                break; // Streak broken
              }
            }
          }

          // Calculate longest streak
          if (uniqueActiveDates.length > 0) {
            tempStreak = 1;
            longestStreak = 1;
            let lastDate = new Date(uniqueActiveDates[0]);

            for (let i = 1; i < uniqueActiveDates.length; i++) {
              const currentDate = new Date(uniqueActiveDates[i]);
              const diffTime = lastDate.getTime() - currentDate.getTime();
              const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

              if (diffDays === 1) {
                tempStreak++;
                lastDate = currentDate;
              } else if (diffDays > 1) {
                if (tempStreak > longestStreak) {
                  longestStreak = tempStreak;
                }
                tempStreak = 1;
                lastDate = currentDate;
              }
            }
            if (tempStreak > longestStreak) {
              longestStreak = tempStreak;
            }
          }

          streakStats = {
            current: currentStreak,
            longest: longestStreak,
          };
        }
      } catch (err) {
        console.error(
          "⚠️ Failed to parse commits for advanced dashboard analytics:",
          err,
        );
      }
    }

    return res.status(200).json({
      status: "SUCCESS",
      stats: {
        languages: globalLangs,
        commitActivity: aggregatedCommitActivity,
        issues: issuesStats,
        radarProfile,
        punchCard,
        streak: streakStats,
        leaderboard,
      },
    });
  } catch (error) {
    console.error("Error generating dashboard statistics:", error);
    next(error);
  }
};
