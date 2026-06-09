import { useMemo } from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import type { RadarProfile } from "./dashboardHelpers";

interface DashboardProductivityRadarProps {
  radarProfile?: RadarProfile;
}

export function DashboardProductivityRadar({ radarProfile }: DashboardProductivityRadarProps) {
  const radarData = useMemo(() => {
    if (!radarProfile) return [];
    return [
      { subject: "Features", value: radarProfile.feature },
      { subject: "Fixes", value: radarProfile.fix },
      { subject: "Refactor", value: radarProfile.refactor },
      { subject: "Testing", value: radarProfile.test },
      { subject: "Docs", value: radarProfile.docs },
      { subject: "Maintenance", value: radarProfile.chore },
    ];
  }, [radarProfile]);

  return (
    <div className="border border-border bg-card/15 p-6 rounded-2xl flex flex-col gap-4">
      <div>
        <h4 className="text-sm font-bold text-foreground">Productivity Focus</h4>
        <p className="text-3xs text-muted-foreground mt-0.5">
          Conventional commit semantic categorization share.
        </p>
      </div>
      <div className="w-full h-64 flex items-center justify-center">
        {radarData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid stroke="#3f3f46" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#a1a1aa", fontSize: 10, fontWeight: 600 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 8 }} />
              <Radar
                name="Focus Share"
                dataKey="value"
                stroke="#818cf8"
                fill="#818cf8"
                fillOpacity={0.2}
              />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <span className="text-xs text-muted-foreground italic">
            No commits fetched to compile focus profile.
          </span>
        )}
      </div>
    </div>
  );
}
