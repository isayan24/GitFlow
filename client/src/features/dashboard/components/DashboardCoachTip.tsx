import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { generateAiTip } from "./dashboardHelpers";
import type { RadarProfile } from "./dashboardHelpers";

interface DashboardCoachTipProps {
  radarProfile?: RadarProfile;
}

export function DashboardCoachTip({ radarProfile }: DashboardCoachTipProps) {
  const aiTip = useMemo(() => {
    return generateAiTip(radarProfile);
  }, [radarProfile]);

  if (!aiTip) return null;

  return (
    <div className="border border-indigo-500/10 bg-indigo-500/5 p-4 rounded-2xl flex gap-3.5 items-start">
      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
        <Sparkles size={16} className="fill-indigo-500/10 animate-pulse" />
      </div>
      <div>
        <h5 className="text-xs font-bold text-foreground">AI Performance Coach</h5>
        <p className="text-xs text-muted-foreground leading-relaxed mt-1">{aiTip}</p>
      </div>
    </div>
  );
}
