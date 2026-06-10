import {
  CommitInfo,
  PunchCardEntry,
  RadarProfile,
  StreakStats,
  CommitActivityWeek,
} from "../../types/dashboard.types.js";

// ─── Date Helpers ─────────────────────────────────────────────────────────────

/**
 * Returns a UTC YYYY-MM-DD date key from a Date object.
 *
 * IMPORTANT: We deliberately use UTC (toISOString) here because:
 *   1. GitHub commit timestamps are in UTC (ISO 8601 with Z suffix).
 *   2. Using local server timezone (getFullYear/getMonth/getDate) caused
 *      a timezone mismatch that silently shifted dates ±1 day, breaking
 *      streak continuity near midnight boundaries.
 *   3. Streak comparison `new Date("YYYY-MM-DD")` also parses as UTC midnight,
 *      so UTC-keyed dates stay consistent end-to-end.
 */
export function toUTCDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// ─── Semantic Radar Profile ───────────────────────────────────────────────────

/**
 * Classifies commits by conventional commit type keywords and returns
 * a percentage profile across six engineering activity categories.
 *
 * Uses greedy first-match classification (most specific matchers first).
 */
export function computeRadarProfile(commits: CommitInfo[]): RadarProfile {
  if (commits.length === 0) {
    return { feature: 0, fix: 0, refactor: 0, test: 0, docs: 0, chore: 0 };
  }

  let featCount = 0;
  let fixCount = 0;
  let refactorCount = 0;
  let testCount = 0;
  let docsCount = 0;
  let choreCount = 0;

  for (const c of commits) {
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
  }

  const total =
    featCount + fixCount + refactorCount + testCount + docsCount + choreCount;

  const pct = (n: number) => Math.round((n / total) * 100);

  return {
    feature: pct(featCount),
    fix: pct(fixCount),
    refactor: pct(refactorCount),
    test: pct(testCount),
    docs: pct(docsCount),
    chore: pct(choreCount),
  };
}

// ─── Punch Card ───────────────────────────────────────────────────────────────

/**
 * Builds a day × hour commit frequency matrix (punch card).
 * Only entries with at least one commit are included.
 */
export function computePunchCard(commits: CommitInfo[]): PunchCardEntry[] {
  const punchMap: Record<string, number> = {};

  for (const c of commits) {
    const key = `${c.day}-${c.hour}`;
    punchMap[key] = (punchMap[key] ?? 0) + 1;
  }

  const result: PunchCardEntry[] = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const count = punchMap[`${d}-${h}`] ?? 0;
      if (count > 0) {
        result.push({ day: d, hour: h, count });
      }
    }
  }

  return result;
}

// ─── Streak Calculation ───────────────────────────────────────────────────────

/**
 * Computes current and longest commit streaks from a set of commits.
 *
 * FIX APPLIED — Three bugs were fixed over the previous implementation:
 *
 * 1. **Count cap replaced by date window** (primary fix):
 *    Previously `fetchRecentCommits(perPage=30)` fetched the last N commits
 *    regardless of date. A single busy day could exhaust the 30-commit quota
 *    leaving weeks of real activity invisible. Now the caller fetches all
 *    commits within a 90-day `since` window so every active day is covered.
 *
 * 2. **UTC date keys** (timezone fix):
 *    Previously `formatDateKey` used local server timezone (getFullYear, etc.)
 *    but date comparison sorted with `new Date("YYYY-MM-DD")` which parses as
 *    UTC midnight. This mismatch silently shifted dates ±1 day near midnight,
 *    breaking streak boundaries. All date keys now use `toISOString().slice(0,10)`.
 *
 * 3. **Robust day-diff via UTC midnight arithmetic**:
 *    Date diff is now computed by comparing UTC midnight timestamps to avoid
 *    DST-induced rounding errors with `Math.round`.
 */
export function computeStreak(
  commits: CommitInfo[],
  commitActivity: CommitActivityWeek[] = [],
): StreakStats {
  const activeDates = new Set<string>();

  // 1. Populate active dates from database commit activity (up to 52 weeks of history)
  for (const act of commitActivity) {
    const weekStartMs = act.week * 1000;
    act.days.forEach((count, i) => {
      if (count > 0) {
        const d = new Date(weekStartMs + i * 86_400_000);
        activeDates.add(d.toISOString().slice(0, 10));
      }
    });
  }

  // 2. Populate active dates from fetched real-time commits (latest commits since last sync)
  for (const c of commits) {
    activeDates.add(c.dateKey);
  }

  // Deduplicate active dates and sort descending (newest first)
  const uniqueDates = Array.from(activeDates).sort((a, b) => b.localeCompare(a));

  if (uniqueDates.length === 0) {
    return { current: 0, longest: 0 };
  }

  /**
   * Compute the difference in calendar days between two YYYY-MM-DD strings.
   * Uses UTC midnight timestamps so DST cannot skew the result.
   */
  const daysBetween = (earlier: string, later: string): number => {
    const msPerDay = 86_400_000;
    const d1 = new Date(`${earlier}T00:00:00Z`).getTime();
    const d2 = new Date(`${later}T00:00:00Z`).getTime();
    return Math.round(Math.abs(d2 - d1) / msPerDay);
  };

  // ── Current Streak ────────────────────────────────────────────────────────
  let currentStreak = 0;
  const todayKey = toUTCDateKey(new Date());
  const yesterdayKey = toUTCDateKey(
    new Date(Date.now() - 86_400_000),
  );

  // A streak is "active" if the most recent commit day is today or yesterday
  const mostRecentDay = uniqueDates[0];
  const isActive =
    mostRecentDay === todayKey || mostRecentDay === yesterdayKey;

  if (isActive) {
    currentStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const diff = daysBetween(uniqueDates[i], uniqueDates[i - 1]);
      if (diff === 1) {
        currentStreak++;
      } else {
        break; // gap found — streak ends
      }
    }
  }

  // ── Longest Streak ────────────────────────────────────────────────────────
  let longestStreak = 1;
  let tempStreak = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const diff = daysBetween(uniqueDates[i], uniqueDates[i - 1]);
    if (diff === 1) {
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 1;
    }
  }

  return { current: currentStreak, longest: longestStreak };
}
