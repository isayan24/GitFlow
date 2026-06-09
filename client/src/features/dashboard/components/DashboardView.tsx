import { Link } from "@tanstack/react-router";
import { Loader2, AlertCircle, FolderGit } from "lucide-react";

import { useDashboardStats } from "../api/useDashboardStats";
import { CommitHeatmap } from "../../projects/components/CommitHeatmap";

import { DashboardKpiCards } from "./DashboardKpiCards";
import { DashboardCoachTip } from "./DashboardCoachTip";
import { DashboardProductivityRadar } from "./DashboardProductivityRadar";
import { DashboardLanguagesFootprint } from "./DashboardLanguagesFootprint";
import { DashboardHabitsPunchCard } from "./DashboardHabitsPunchCard";
import { DashboardLeaderboard } from "./DashboardLeaderboard";

export function DashboardView() {
  const { data: stats, isLoading, error } = useDashboardStats();

  console.log(stats);

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3">
        <Loader2
          size={36}
          className="animate-spin text-primary stroke-[1.5] self-center"
        />
        <span className="text-sm text-muted-foreground">
          Compiling aggregated workspace stats...
        </span>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !stats) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-3">
        <AlertCircle
          size={32}
          className="text-destructive stroke-[1.5] self-center"
        />
        <span className="text-muted-foreground text-sm">
          Failed to load aggregated dashboard details.
        </span>
      </div>
    );
  }

  /* ── Empty state ── */
  if (stats.commitActivity.length === 0) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-4">
        <FolderGit
          size={40}
          className="text-muted-foreground/35 stroke-[1.2] self-center"
        />
        <div className="text-center">
          <h4 className="text-lg font-bold text-foreground">
            Welcome to GitFlow
          </h4>
          <p className="text-muted-foreground text-sm mt-1">
            Import your repositories to aggregate commit activities, language
            shares, and task boards here.
          </p>
        </div>
        <Link
          to="/dashboard/projects"
          className="self-center inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition cursor-pointer"
        >
          Go to Workspace Setup
        </Link>
      </div>
    );
  }

  /* ── Dashboard ── */
  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 text-left">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
            Developer Performance
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Aggregated statistics across all active workspaces.
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <DashboardKpiCards streak={stats.streak} issues={stats.issues} />

      {/* AI Coach tip */}
      <DashboardCoachTip radarProfile={stats.radarProfile} />

      {/* Commit heatmap */}
      <CommitHeatmap
        commitActivity={stats.commitActivity.map((act) => ({
          ...act,
          id: act.week.toString(),
        }))}
        languages={stats.languages}
      />

      {/* Charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardProductivityRadar radarProfile={stats.radarProfile} />
        <DashboardLanguagesFootprint languages={stats.languages} />
        <DashboardHabitsPunchCard punchCard={stats.punchCard} />
        <DashboardLeaderboard leaderboard={stats.leaderboard} />
      </div>
    </div>
  );
}
