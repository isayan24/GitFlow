import { useEffect, useRef } from "react";
import CalHeatmap from "cal-heatmap";
import Tooltip from "cal-heatmap/plugins/Tooltip";
import "cal-heatmap/cal-heatmap.css";
import { CalendarDays } from "lucide-react";

interface CommitHeatmapProps {
  commitActivity: {
    id: string;
    week: number;
    days: number[];
    total: number;
  }[];
}

// Local-safe YYYY-MM-DD date formatter helper
const formatDate = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export function CommitHeatmap({ commitActivity = [] }: CommitHeatmapProps) {
  const calRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!calRef.current) return;

    let destroyed = false;
    calRef.current.innerHTML = "";

    const sourceData: { date: string; value: number }[] = [];
    const dateMap = new Map<string, number>();

    // 1. Initialize all days in the 12-month calendar range to 0
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 11);
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
          range: 12,
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

      <div className="overflow-x-auto no-scrollbar py-2">
        <div ref={calRef} id="cal-heatmap" className="cal-heatmap-dark" />
      </div>
    </div>
  );
}
