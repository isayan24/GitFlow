import { useEffect, useRef, useMemo } from "react";
import CalHeatmap from "cal-heatmap";
import Tooltip from "cal-heatmap/plugins/Tooltip";
import "cal-heatmap/cal-heatmap.css";
import "./CommitHeatmap.css";
import { CalendarDays } from "lucide-react";
import {
  formatDate,
  LANGUAGE_COLORS,
  type CommitHeatmapProps,
} from "../libs/commitHeatmapUtils";
import { useAppStore } from "@/store/useAppStore";

const HEATMAP_COLORS = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];
const MONTHS_TO_SHOW = 10; // past (N-1) months + current month

const getLanguageColor = (lang: string) => LANGUAGE_COLORS[lang] ?? "#8b949e";

export function CommitHeatmap({
  commitActivity = [],
  languages,
}: CommitHeatmapProps) {
  const calRef = useRef<HTMLDivElement>(null);
  const setSelectedDateStr = useAppStore((state) => state.setSelectedDateStr);
  const setShowRightSidebar = useAppStore((state) => state.setShowRightSidebar);

  /* ── Language breakdown ── */
  const languagesData = useMemo(() => {
    if (!languages) return [];
    const langs = languages as Record<string, number>;
    const totalBytes = Object.values(langs).reduce((s, v) => s + v, 0);
    if (totalBytes === 0) return [];

    const raw = Object.entries(langs)
      .map(([name, bytes]) => ({
        name,
        bytes,
        percentage: (bytes / totalBytes) * 100,
        color: getLanguageColor(name),
      }))
      .sort((a, b) => b.bytes - a.bytes);

    const keepers = raw.filter((l) => l.percentage >= 1.0);
    const others = raw.filter((l) => l.percentage < 1.0);

    // Always show at least the top language
    if (keepers.length === 0 && raw.length > 0) {
      keepers.push(raw[0]);
      others.shift();
    }

    if (others.length > 0) {
      keepers.push({
        name: "Other",
        bytes: others.reduce((s, l) => s + l.bytes, 0),
        percentage: others.reduce((s, l) => s + l.percentage, 0),
        color: "#8b949e",
      });
    }

    return keepers;
  }, [languages]);

  /* ── Heatmap ── */
  useEffect(() => {
    if (!calRef.current) return;

    let destroyed = false;
    calRef.current.innerHTML = "";

    // Aggregate all commit days — accumulate so multi-repo days sum correctly.
    // No range guard: commitActivity can span 52–91 weeks, a guard would drop data.
    const dateMap = new Map<string, number>();
    commitActivity.forEach(({ week, days }) => {
      const weekStart = new Date(week * 1000);
      days.forEach((count, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        const key = formatDate(d);
        dateMap.set(key, (dateMap.get(key) ?? 0) + count);
      });
    });

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - (MONTHS_TO_SHOW - 1));
    startDate.setDate(1);

    const sourceData = Array.from(dateMap, ([date, value]) => ({
      date,
      value,
    }));

    const cal = new CalHeatmap();
    cal.on("click", (_event: any, timestamp: any, _value: any) => {
      if (!timestamp) return;
      const dateObj = new Date(Number(timestamp));
      const yyyy = dateObj.getUTCFullYear();
      const mm = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(dateObj.getUTCDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      setSelectedDateStr(dateStr);
      setShowRightSidebar(true);
    });
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
            defaultValue: 0, // no-data cells → #161b22 (dark), not white
          },
          scale: {
            color: {
              type: "threshold",
              range: HEATMAP_COLORS,
              domain: [1, 3, 6, 10],
            },
          },
          range: MONTHS_TO_SHOW,
        },
        [
          [
            Tooltip,
            {
              enabled: true,
              text: (_ts: number, value: number, dayjsDate: any) =>
                `${value || 0} commits on ${dayjsDate.format("LL")}`,
            },
          ],
        ],
      )
      .then(() => {
        if (destroyed) {
          cal.destroy();
          return;
        }

        if (!calRef.current) return;

        // Hide future day cells — CalHeatmap renders full months but we clip at today.
        // CalHeatmap v4 (D3) binds each rect's data via __data__.t (Unix timestamp).
        const todayEndMs = new Date().setHours(23, 59, 59, 999);
        calRef.current
          .querySelectorAll<SVGRectElement>("rect.ch-subdomain-bg")
          .forEach((rect) => {
            const { t } = ((rect as any).__data__ ?? {}) as { t?: number };
            if (t !== undefined) {
              const cellMs = t > 1e12 ? t : t * 1000; // normalise s → ms if needed
              if (cellMs > todayEndMs)
                rect.setAttribute("visibility", "hidden");
            }
          });

        // Guard against duplicate wrappers from concurrent renders
        if (calRef.current.children.length > 1) {
          Array.from(calRef.current.children)
            .slice(0, -1)
            .forEach((c) => c.remove());
        }
      });

    return () => {
      destroyed = true;
      cal.destroy();
    };
  }, [commitActivity]);

  /* ── Empty state ── */
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
      {/* Header */}
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
          {HEATMAP_COLORS.map((color) => (
            <div
              key={color}
              className="w-2.5 h-2.5 rounded-xs"
              style={{ backgroundColor: color }}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
        {/* Heatmap */}
        <div className="flex-1 overflow-x-auto no-scrollbar py-2 w-full lg:w-auto">
          <div ref={calRef} className="cal-heatmap-dark" />
        </div>

        {/* Languages */}
        {languagesData.length > 0 && (
          <div className="w-full lg:w-64 shrink-0 flex flex-col gap-3 border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-6 text-left">
            <h5 className="text-2xs font-bold uppercase tracking-wider text-muted-foreground/80">
              Languages
            </h5>

            <div className="w-full h-2 rounded-full overflow-hidden flex bg-muted/20">
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

            <div className="flex flex-col gap-2 max-h-36 overflow-y-auto no-scrollbar">
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
