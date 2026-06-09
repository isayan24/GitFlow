import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

interface LeaderboardItem {
  repoId: string;
  repoName: string;
  commits: number;
}

interface DashboardLeaderboardProps {
  leaderboard: LeaderboardItem[];
}

export function DashboardLeaderboard({ leaderboard }: DashboardLeaderboardProps) {
  const totalCommits = leaderboard.reduce((sum, r) => sum + r.commits, 0);

  return (
    <div className="border border-border bg-card/15 p-6 rounded-2xl flex flex-col gap-4 md:col-span-2 text-left">
      <div>
        <h4 className="text-sm font-bold text-foreground">Active Workspaces Leaderboard</h4>
        <p className="text-3xs text-muted-foreground mt-0.5">
          Commit volume distribution among imported repositories.
        </p>
      </div>

      <div className="flex flex-col gap-4 mt-2">
        {leaderboard.length > 0 ? (
          leaderboard.map((item, idx) => {
            const sharePercent = totalCommits > 0 ? (item.commits / totalCommits) * 100 : 0;
            return (
              <div key={item.repoId} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    <span className="text-3xs text-muted-foreground w-4">#{idx + 1}</span>
                    <Link
                      to="/dashboard/projects/$projectId"
                      params={{ projectId: item.repoId }}
                      className="hover:underline flex items-center gap-1 hover:text-primary transition duration-150"
                    >
                      {item.repoName}
                      <ChevronRight size={10} className="text-muted-foreground" />
                    </Link>
                  </div>
                  <span className="font-mono font-semibold text-muted-foreground">
                    {item.commits} commits ({sharePercent.toFixed(0)}%)
                  </span>
                </div>
                {/* Horizontal progress bar */}
                <div className="w-full h-2 rounded-full overflow-hidden bg-muted/20">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                    style={{ width: `${sharePercent}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <span className="text-xs text-muted-foreground italic">
            No workspace contributions tracked.
          </span>
        )}
      </div>
    </div>
  );
}
