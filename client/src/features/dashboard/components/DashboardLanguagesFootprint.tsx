import { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from "recharts";
import { getLanguageColor } from "./dashboardHelpers";

interface DashboardLanguagesFootprintProps {
  languages?: Record<string, number>;
}

export function DashboardLanguagesFootprint({ languages }: DashboardLanguagesFootprintProps) {
  const languagesData = useMemo(() => {
    if (!languages) return [];
    const totalBytes = Object.values(languages).reduce((sum, val) => sum + val, 0);
    if (totalBytes === 0) return [];

    const rawLangs = Object.entries(languages)
      .map(([name, bytes]) => ({
        name,
        value: bytes,
        percentage: (bytes / totalBytes) * 100,
        color: getLanguageColor(name),
      }))
      .sort((a, b) => b.value - a.value);

    const keepers = rawLangs.filter((l) => l.percentage >= 1.0);
    const others = rawLangs.filter((l) => l.percentage < 1.0);

    if (keepers.length === 0 && rawLangs.length > 0) {
      keepers.push(rawLangs[0]);
      others.shift();
    }

    if (others.length > 0) {
      const otherBytes = others.reduce((sum, l) => sum + l.value, 0);
      const otherPercentage = others.reduce((sum, l) => sum + l.percentage, 0);
      keepers.push({
        name: "Other",
        value: otherBytes,
        percentage: otherPercentage,
        color: "#8b949e",
      });
    }

    return keepers;
  }, [languages]);

  return (
    <div className="border border-border bg-card/15 p-6 rounded-2xl flex flex-col gap-4">
      <div>
        <h4 className="text-sm font-bold text-foreground">Aggregated Languages</h4>
        <p className="text-3xs text-muted-foreground mt-0.5">
          Total technology bytes across all imported codebases.
        </p>
      </div>
      <div className="w-full h-64 flex items-center justify-center">
        {languagesData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={languagesData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {languagesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "rgba(9, 9, 11, 0.95)",
                  borderColor: "rgba(63, 63, 70, 0.4)",
                  borderRadius: "12px",
                  color: "#f4f4f5",
                  fontSize: "11px",
                }}
                formatter={(_value: any, name: any, props: any) => [
                  `${props.payload.percentage.toFixed(1)}%`,
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <span className="text-xs text-muted-foreground italic">
            No codebase language stats cached.
          </span>
        )}
      </div>
    </div>
  );
}
