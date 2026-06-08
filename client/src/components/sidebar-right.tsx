"use client";

import * as React from "react";
import { Sidebar, SidebarHeader } from "@/components/ui/sidebar";
import {
  PanelRightClose,
  CalendarDays,
  Loader2,
  GitCommit,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useAppStore } from "@/store/useAppStore";
import { useImportedProjects } from "@/features/projects/api/useImportedProjects";
import { useProjectDetails } from "@/features/projects/api/useProjectDetails";
import { useRepoCommits } from "@/features/projects/api/useRepoCommits";

interface SidebarRightProps extends React.ComponentProps<typeof Sidebar> {}

const formatDateStr = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function SidebarRight({ ...props }: SidebarRightProps) {
  const setShowRightSidebar = useAppStore((state) => state.setShowRightSidebar);
  const globalSelectedRepoId = useAppStore((state) => state.selectedRepoId);

  const { data: importedRepos = [] } = useImportedProjects();
  const [selectedRepoId, setSelectedRepoId] = React.useState<string>("");
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    new Date(),
  );

  // Sync with globalSelectedRepoId on load/change
  React.useEffect(() => {
    if (globalSelectedRepoId) {
      setSelectedRepoId(globalSelectedRepoId);
    } else if (importedRepos.length > 0 && !selectedRepoId) {
      setSelectedRepoId(importedRepos[0].id);
    }
  }, [globalSelectedRepoId, importedRepos]);

  // Fetch selected project details (includes commitActivity)
  const { data: projectDetails } = useProjectDetails(selectedRepoId || null);

  // Map WeeklyCommitActivity to individual YYYY-MM-DD string key
  const commitMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    if (!projectDetails?.commitActivity) return map;

    for (const activity of projectDetails.commitActivity) {
      const weekStart = new Date(activity.week * 1000);
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + i);
        const dateStr = formatDateStr(dayDate);
        const count = activity.days[i];
        if (count > 0) {
          map[dateStr] = (map[dateStr] || 0) + count;
        }
      }
    }
    return map;
  }, [projectDetails]);

  // Define calendar modifiers based on commit count (heatmap logic)
  const modifiers = React.useMemo(() => {
    return {
      commitsLow: (date: Date) => {
        const dateStr = formatDateStr(date);
        const count = commitMap[dateStr] || 0;
        return count >= 1 && count <= 2;
      },
      commitsMedium: (date: Date) => {
        const dateStr = formatDateStr(date);
        const count = commitMap[dateStr] || 0;
        return count >= 3 && count <= 5;
      },
      commitsHigh: (date: Date) => {
        const dateStr = formatDateStr(date);
        const count = commitMap[dateStr] || 0;
        return count >= 6;
      },
    };
  }, [commitMap]);

  const modifiersClassNames = {
    commitsLow:
      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium hover:bg-emerald-500/20",
    commitsMedium:
      "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-semibold hover:bg-emerald-500/35",
    commitsHigh:
      "bg-emerald-500/50 text-white border border-emerald-500/70 font-bold hover:bg-emerald-500/60",
  };

  // Fetch commits for selected repository and date
  const dateStr = selectedDate ? formatDateStr(selectedDate) : null;
  const { data: commits = [], isLoading: loadingCommits } = useRepoCommits(
    selectedRepoId || null,
    dateStr,
    !!selectedRepoId,
  );

  return (
    <Sidebar
      collapsible="none"
      className="sticky top-0 hidden h-svh border-l border-sidebar-border bg-sidebar lg:flex w-80 flex-col"
      {...props}
    >
      {/* Header */}
      <SidebarHeader className="h-14 border-b border-sidebar-border px-4 flex flex-row items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-sidebar-foreground">
          <CalendarDays size={16} className="text-primary" />
          <span className="font-bold text-sm">Schedule</span>
        </div>
        <button
          onClick={() => setShowRightSidebar(false)}
          className="p-1 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition duration-150 cursor-pointer"
          title="Hide Calendar"
        >
          <PanelRightClose size={16} />
        </button>
      </SidebarHeader>

      {/* Select Box */}
      <div className="px-4 py-3 flex flex-col gap-1.5 border-b border-sidebar-border shrink-0 bg-sidebar">
        <label className="text-[9px] uppercase font-bold tracking-wider text-sidebar-foreground/40 text-left">
          Select Workspace
        </label>
        <select
          value={selectedRepoId}
          onChange={(e) => setSelectedRepoId(e.target.value)}
          className="w-full bg-sidebar-accent border border-sidebar-border rounded-xl px-3 py-2.5 text-xs text-sidebar-foreground focus:outline-none focus:border-primary transition duration-150 cursor-pointer"
        >
          <option value="" disabled>
            Select a repository...
          </option>
          {importedRepos.map((repo: any) => (
            <option key={repo.id} value={repo.id}>
              {repo.name}
            </option>
          ))}
        </select>
      </div>

      {/* Calendar Area */}
      <div className="px-3 py-2 border-b border-sidebar-border bg-sidebar shrink-0 flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          className="bg-transparent [--cell-size:2.05rem]"
          endMonth={new Date()}
          disabled={{ after: new Date() }}
        />
      </div>

      {/* Commits Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-sidebar">
        <div className="px-4 py-3.5 flex items-center justify-between border-b border-sidebar-border bg-sidebar-accent/15 shrink-0">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-sidebar-foreground/40 text-left">
            Commits for{" "}
            {selectedDate
              ? selectedDate.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })
              : ""}
          </span>
          {selectedDate && commitMap[formatDateStr(selectedDate)] > 0 && (
            <span className="text-3xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
              {commitMap[formatDateStr(selectedDate)]} commits
            </span>
          )}
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col gap-3">
          {loadingCommits ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2.5">
              <Loader2
                size={24}
                className="animate-spin text-primary stroke-[1.5]"
              />
              <span className="text-3xs text-muted-foreground">
                Loading commits...
              </span>
            </div>
          ) : !selectedRepoId ? (
            <div className="text-center py-16 text-xs text-muted-foreground italic">
              Select a repository to view commits
            </div>
          ) : commits.length === 0 ? (
            <div className="text-center py-16 text-xs text-muted-foreground italic border border-dashed border-sidebar-border/60 rounded-2xl flex flex-col items-center gap-2 p-6 bg-sidebar-accent/5">
              <GitCommit
                size={22}
                className="text-muted-foreground/35 stroke-[1.5]"
              />
              <span>No commits found on this date</span>
            </div>
          ) : (
            <CommitCard commits={commits} />
          )}
        </div>
      </div>
    </Sidebar>
  );
}

const CommitCard = ({ commits }: any) => {
  return (
    <div className="flex flex-col gap-2.5">
      {commits.map((commit: any) => (
        <a
          key={commit.sha}
          href={commit.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col gap-2 p-3 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/5 hover:border-accent hover:bg-sidebar-accent/20 transition duration-150 group text-left"
        >
          <span className="text-3xs font-bold text-primary font-mono group-hover:underline">
            {commit.sha.substring(0, 7)}
          </span>
          <p className="text-xs text-sidebar-foreground font-medium leading-relaxed line-clamp-2">
            {commit.message}
          </p>
          <div className="flex items-center justify-between mt-1 pt-2 border-t border-sidebar-border/40">
            <div className="flex items-center gap-2 min-w-0">
              {commit.authorAvatarUrl ? (
                <img
                  src={commit.authorAvatarUrl}
                  alt={commit.author}
                  className="w-4 h-4 rounded-full bg-muted border border-sidebar-border shrink-0"
                />
              ) : (
                <div className="w-4 h-4 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
                  <span className="text-[8px] font-bold text-sidebar-foreground/70">
                    {commit.author[0]}
                  </span>
                </div>
              )}
              <span className="text-3xs text-sidebar-foreground/70 truncate font-semibold">
                {commit.author}
              </span>
            </div>
            <span className="text-3xs text-sidebar-foreground/40 shrink-0">
              {new Date(commit.date).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </a>
      ))}
    </div>
  );
};
