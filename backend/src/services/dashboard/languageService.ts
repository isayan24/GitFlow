import { CommitActivityWeek } from "../../types/dashboard.types.js";

type RepositoryWithActivity = {
  languages: unknown;
  commitActivity: Array<{ week: number; days: number[] }>;
};

/**
 * Aggregates raw language byte counts across all user repositories
 * into a single sorted map.
 */
export function aggregateLanguages(
  repositories: RepositoryWithActivity[],
): Record<string, number> {
  const globalLangs: Record<string, number> = {};

  for (const repo of repositories) {
    if (repo.languages && typeof repo.languages === "object") {
      const langs = repo.languages as Record<string, number>;
      for (const [name, bytes] of Object.entries(langs)) {
        globalLangs[name] = (globalLangs[name] ?? 0) + bytes;
      }
    }
  }

  return globalLangs;
}

/**
 * Merges weekly commit activity from multiple repositories into a unified
 * timeline, summing commits by day for each week unix timestamp.
 */
export function aggregateCommitActivity(
  repositories: RepositoryWithActivity[],
): CommitActivityWeek[] {
  const weeklyMap: Record<number, number[]> = {};

  for (const repo of repositories) {
    for (const act of repo.commitActivity) {
      if (!weeklyMap[act.week]) {
        weeklyMap[act.week] = [0, 0, 0, 0, 0, 0, 0];
      }
      for (let i = 0; i < 7; i++) {
        weeklyMap[act.week][i] += act.days[i] ?? 0;
      }
    }
  }

  return Object.entries(weeklyMap)
    .map(([weekStr, days]) => {
      const week = Number(weekStr);
      const total = days.reduce((sum, val) => sum + val, 0);
      return { week, days, total };
    })
    .sort((a, b) => a.week - b.week);
}
