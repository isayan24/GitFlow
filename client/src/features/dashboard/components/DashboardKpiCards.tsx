import { Flame, AlertCircle, CheckCircle2, Hourglass } from "lucide-react";

interface DashboardKpiCardsProps {
  streak: {
    current: number;
    longest: number;
  };
  issues: {
    open: number;
    closed: number;
    avgResolutionDays: number;
  };
}

export function DashboardKpiCards({ streak, issues }: DashboardKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Streak card */}
      <div className="border border-border bg-card/25 p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden group">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
          <Flame size={20} className="group-hover:scale-110 transition duration-150 fill-orange-500/10" />
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60">Commit Streak</span>
          <h4 className="text-lg font-extrabold text-foreground mt-0.5">
            {streak.current} <span className="text-xs font-bold text-muted-foreground">days</span>
          </h4>
          <p className="text-3xs text-muted-foreground/75 mt-0.5">Longest: {streak.longest} days</p>
        </div>
      </div>

      {/* Open Issues card */}
      <div className="border border-border bg-card/25 p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden group">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
          <AlertCircle size={20} className="group-hover:scale-110 transition duration-150" />
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60">Open Tasks</span>
          <h4 className="text-lg font-extrabold text-foreground mt-0.5">{issues.open}</h4>
          <p className="text-3xs text-muted-foreground/75 mt-0.5">Awaiting resolution</p>
        </div>
      </div>

      {/* Closed Issues card */}
      <div className="border border-border bg-card/25 p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden group">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
          <CheckCircle2 size={20} className="group-hover:scale-110 transition duration-150" />
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60">Tasks Closed</span>
          <h4 className="text-lg font-extrabold text-foreground mt-0.5">{issues.closed}</h4>
          <p className="text-3xs text-muted-foreground/75 mt-0.5">Resolved in active workspaces</p>
        </div>
      </div>

      {/* Resolution Speed card */}
      <div className="border border-border bg-card/25 p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden group">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
          <Hourglass size={20} className="group-hover:scale-110 transition duration-150" />
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60">Avg Close Time</span>
          <h4 className="text-lg font-extrabold text-foreground mt-0.5">
            {issues.avgResolutionDays} <span className="text-xs font-bold text-muted-foreground">days</span>
          </h4>
          <p className="text-3xs text-muted-foreground/75 mt-0.5">Resolution SLA</p>
        </div>
      </div>
    </div>
  );
}
