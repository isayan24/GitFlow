import { useEffect, useRef, useMemo } from "react";
import CalHeatmap from "cal-heatmap";
import Tooltip from "cal-heatmap/plugins/Tooltip";
import "cal-heatmap/cal-heatmap.css";
import { CalendarDays } from "lucide-react";
import {
  formatDate,
  LANGUAGE_COLORS,
  type CommitHeatmapProps,
} from "../libs/commitHeatmapUtils";

const getLanguageColor = (lang: string): string => {
  return LANGUAGE_COLORS[lang] || "#8b949e";
};

// Local-safe YYYY-MM-DD date formatter helper

export function CommitHeatmap({
  commitActivity = [],
  languages,
}: CommitHeatmapProps) {
  const calRef = useRef<HTMLDivElement>(null);

  const languagesData = useMemo(() => {
    if (!languages) return [];
    const langs = languages as Record<string, number>;
    const totalBytes = Object.values(langs).reduce((sum, val) => sum + val, 0);
    if (totalBytes === 0) return [];

    const rawLangs = Object.entries(langs)
      .map(([name, bytes]) => ({
        name,
        bytes,
        percentage: (bytes / totalBytes) * 100,
        color: getLanguageColor(name),
      }))
      .sort((a, b) => b.bytes - a.bytes);

    const keepers = rawLangs.filter((l) => l.percentage >= 1.0);
    const others = rawLangs.filter((l) => l.percentage < 1.0);

    // Safe fallback: keep at least the top language even if it's under 1.0%
    if (keepers.length === 0 && rawLangs.length > 0) {
      keepers.push(rawLangs[0]);
      others.shift();
    }

    if (others.length > 0) {
      const otherBytes = others.reduce((sum, l) => sum + l.bytes, 0);
      const otherPercentage = others.reduce((sum, l) => sum + l.percentage, 0);
      keepers.push({
        name: "Other",
        bytes: otherBytes,
        percentage: otherPercentage,
        color: "#8b949e",
      });
    }

    return keepers;
  }, [languages]);

  useEffect(() => {
    if (!calRef.current) return;

    let destroyed = false;
    calRef.current.innerHTML = "";

    const sourceData: { date: string; value: number }[] = [];
    const dateMap = new Map<string, number>();

    // 1. Initialize all days in the 8-month calendar range to 0
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 9);
    startDate.setDate(1); // Align to the 1st of the starting month

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0); // Last day of the current month

    const currentIterDate = new Date(startDate);
    while (currentIterDate <= endDate) {
      dateMap.set(formatDate(currentIterDate), 0);
      currentIterDate.setDate(currentIterDate.getDate() + 1);
    }

    // 2. Overwrite with actual commitActivity data
    commitActivity.forEach((weekData) => {
      const startOfWeek = new Date(weekData.week * 1000);
      weekData.days.forEach((dayCount, dayIndex) => {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + dayIndex);
        const dateKey = formatDate(dayDate);

        if (dateMap.has(dateKey)) {
          dateMap.set(dateKey, dayCount);
        }
      });
    });

    // 3. Convert map to sourceData array
    dateMap.forEach((value, date) => {
      sourceData.push({ date, value });
    });

    const cal = new CalHeatmap();
    cal
      .paint(
        {
          itemSelector: calRef.current,
          domain: {
            type: "month",
            gutter: 3,
            label: { text: "MMM", position: "top", textAlign: "start" },
          },
          subDomain: {
            type: "ghDay",
            radius: 2,
            width: 11,
            height: 11,
            gutter: 3,
          },
          date: { start: startDate },
          data: {
            source: sourceData,
            x: "date",
            y: "value",
            groupY: "sum",
          },
          scale: {
            color: {
              type: "threshold",
              range: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
              domain: [1, 3, 6, 10],
            },
          },
          range: 10,
        },
        [
          [
            Tooltip,
            {
              enabled: true,
              text: (_timestamp: number, value: number, dayjsDate: any) => {
                return `${value || 0} commits on ${dayjsDate.format("LL")}`;
              },
            },
          ],
        ],
      )
      .then(() => {
        if (destroyed) {
          cal.destroy();
          return;
        }

        // Clean up duplicate wrapper elements that might append concurrently
        if (calRef.current && calRef.current.children.length > 1) {
          Array.from(calRef.current.children)
            .slice(0, -1)
            .forEach((child) => child.remove());
        }
      });

    return () => {
      destroyed = true;
      cal.destroy();
    };
  }, [commitActivity]);

  if (commitActivity.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 border border-dashed border-border rounded-2xl bg-card/20 text-muted-foreground text-xs text-center">
        <span>
          No commit activity statistics cached. Commit calendar will populate
          once statistics are compiled by GitHub.
        </span>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-sm flex flex-col gap-4 text-left overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-primary" />
          <div>
            <h4 className="text-sm font-bold text-foreground">
              Repository Contribution Calendar
            </h4>
            <p className="text-muted-foreground text-[10px] mt-0.5">
              Standalone development activity heatmap powered by Cal-Heatmap.
            </p>
          </div>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span>Less</span>
          {["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"].map(
            (color) => (
              <div
                key={color}
                className="w-2.5 h-2.5 rounded-xs"
                style={{ backgroundColor: color }}
              />
            ),
          )}
          <span>More</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
        {/* Heatmap Column */}
        <div className="flex-1 overflow-x-auto no-scrollbar py-2 w-full lg:w-auto">
          <div ref={calRef} id="cal-heatmap" className="cal-heatmap-dark" />
        </div>

        {/* Languages Column */}
        {languagesData.length > 0 && (
          <div className="w-full lg:w-64 shrink-0 flex flex-col gap-3 border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-6 text-left">
            <h5 className="text-2xs font-bold uppercase tracking-wider text-muted-foreground/80">
              Languages
            </h5>

            {/* Horizontal progress bar */}
            <div className="w-full h-2 rounded-full overflow-hidden flex bg-muted/20 mt-1">
              {languagesData.map((lang) => (
                <div
                  key={lang.name}
                  style={{
                    width: `${lang.percentage}%`,
                    backgroundColor: lang.color,
                  }}
                  className="h-full transition-all duration-300"
                  title={`${lang.name}: ${lang.percentage.toFixed(1)}%`}
                />
              ))}
            </div>

            {/* List */}
            <div className="flex flex-col gap-2 mt-2 max-h-36 overflow-y-auto no-scrollbar">
              {languagesData.map((lang) => (
                <div
                  key={lang.name}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: lang.color }}
                    />
                    <span className="font-semibold text-foreground truncate">
                      {lang.name}
                    </span>
                  </div>
                  <span className="text-2xs text-muted-foreground shrink-0">
                    {lang.percentage.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
