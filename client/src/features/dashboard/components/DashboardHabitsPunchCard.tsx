import { useMemo } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip as RechartsTooltip,
} from "recharts";
import { DAYS_OF_WEEK } from "./dashboardHelpers";

interface PunchCardItem {
  day: number;
  hour: number;
  count: number;
}

interface DashboardHabitsPunchCardProps {
  punchCard?: PunchCardItem[];
}

export function DashboardHabitsPunchCard({ punchCard }: DashboardHabitsPunchCardProps) {
  const punchCardData = useMemo(() => {
    if (!punchCard) return [];
    return punchCard.map((pc) => ({
      dayIndex: pc.day,
      day: DAYS_OF_WEEK[pc.day],
      hour: pc.hour,
      count: pc.count,
    }));
  }, [punchCard]);

  return (
    <div className="border border-border bg-card/15 p-6 rounded-2xl flex flex-col gap-4 md:col-span-2">
      <div>
        <h4 className="text-sm font-bold text-foreground">Coding Habits (Punch Card)</h4>
        <p className="text-3xs text-muted-foreground mt-0.5">
          Active hours of the day (0-23) vs days of the week (Sun-Sat) for recent commits.
        </p>
      </div>
      <div className="w-full h-72">
        {punchCardData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <XAxis
                type="number"
                dataKey="hour"
                name="Hour"
                domain={[0, 23]}
                tickCount={24}
                tick={{ fill: "#a1a1aa", fontSize: 9 }}
                stroke="#27272a"
              />
              <YAxis
                type="number"
                dataKey="dayIndex"
                name="Day"
                domain={[0, 6]}
                tickFormatter={(val) => DAYS_OF_WEEK[val]}
                tickCount={7}
                tick={{ fill: "#a1a1aa", fontSize: 10, fontWeight: 600 }}
                stroke="#27272a"
              />
              <ZAxis type="number" dataKey="count" range={[40, 450]} />
              <RechartsTooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{
                  backgroundColor: "rgba(9, 9, 11, 0.95)",
                  borderColor: "rgba(63, 63, 70, 0.4)",
                  borderRadius: "12px",
                  color: "#f4f4f5",
                  fontSize: "11px",
                }}
                formatter={(value: any, name: any) => {
                  if (name === "Day") return [DAYS_OF_WEEK[value], "Day"];
                  if (name === "Hour") return [`${value}:00`, "Hour"];
                  return [value, "Commits"];
                }}
              />
              <Scatter name="Activity density" data={punchCardData} fill="#10b981" />
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs text-muted-foreground italic">
              No recent commit timestamps recorded.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
