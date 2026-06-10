export interface CommitInfo {
  date: Date; /** YYYY-MM-DD in UTC */
  dateKey: string; /** Hour of day (0–23) in UTC */
  hour: number; /** Day of week (0=Sun … 6=Sat) in UTC */
  day: number;
  message: string;
}

export interface RepoCommitBatch {
  repoId: string;
  repoName: string;
  commits: CommitInfo[];
}

// ─── Aggregated Stats Shapes ──────────────────────────────────────────────────

export interface RadarProfile {
  feature: number;
  fix: number;
  refactor: number;
  test: number;
  docs: number;
  chore: number;
}

export interface PunchCardEntry {
  day: number;
  hour: number;
  count: number;
}

export interface StreakStats {
  current: number;
  longest: number;
}

export interface IssueMetrics {
  open: number;
  closed: number;
  avgResolutionDays: number;
}

export interface LeaderboardEntry {
  repoId: string;
  repoName: string;
  commits: number;
}

export interface CommitActivityWeek {
  week: number;
  days: number[];
  total: number;
}

// ─── Full Dashboard Response ──────────────────────────────────────────────────

export interface DashboardStats {
  languages: Record<string, number>;
  commitActivity: CommitActivityWeek[];
  issues: IssueMetrics;
  radarProfile: RadarProfile;
  punchCard: PunchCardEntry[];
  streak: StreakStats;
  leaderboard: LeaderboardEntry[];
}

export const EMPTY_DASHBOARD_STATS: DashboardStats = {
  languages: {},
  commitActivity: [],
  issues: { open: 0, closed: 0, avgResolutionDays: 0 },
  radarProfile: { feature: 0, fix: 0, refactor: 0, test: 0, docs: 0, chore: 0 },
  punchCard: [],
  streak: { current: 0, longest: 0 },
  leaderboard: [],
};
