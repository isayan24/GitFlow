import { Folder, Plus, ArrowRight, Loader2, GitCommit } from "lucide-react";
import { useImportedProjects } from "../api/useImportedProjects";
import { getLast7DaysData } from "../libs/getLast7DaysData";

interface ProjectListProps {
  onSelectProject: (id: string) => void;
  onImportClick: () => void;
}

export function ProjectList({
  onSelectProject,
  onImportClick,
}: ProjectListProps) {
  const { data: importedRepos = [], isLoading } = useImportedProjects();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2
          size={36}
          className="animate-spin text-primary stroke-[1.5] self-center"
        />
        <span className="text-sm text-muted-foreground">
          Loading workspaces...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 text-left">
      <div>
        <h3 className="text-2xl font-extrabold tracking-tight text-foreground font-sans">
          Workspaces & Projects
        </h3>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your active workspaces synced directly from GitHub.
        </p>
      </div>

      {importedRepos.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-3">
          <Folder
            size={32}
            className="text-muted-foreground/35 stroke-[1.5] self-center"
          />
          <span className="text-muted-foreground text-sm">
            No imported workspaces yet.
          </span>
          <button
            onClick={onImportClick}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition cursor-pointer"
          >
            <Plus size={14} /> Import Your First Repo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {importedRepos.map((repo: any) => (
            <div
              key={repo.id}
              className="p-5 rounded-2xl border border-border bg-card/45 backdrop-blur-sm flex flex-col justify-between hover:border-accent transition duration-150 group"
            >
              <div className="flex items-start gap-4">
                {repo.imageUrl ? (
                  <img
                    src={repo.imageUrl}
                    alt={repo.name}
                    className="w-12 h-12 rounded-xl bg-muted border border-border shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground shrink-0">
                    <Folder size={20} />
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="font-bold text-base text-foreground group-hover:text-primary transition truncate">
                    {repo.name}
                  </h4>
                  <p className="text-3xs text-muted-foreground/60 mt-0.5">
                    Owned by @{repo.owner}
                  </p>
                  <p className="text-xs text-muted-foreground/90 mt-2 line-clamp-2 leading-relaxed">
                    {repo.description || "No project description provided."}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/60">
                {/* Stats Counter */}
                <div className="flex items-center gap-4 text-3xs text-muted-foreground/85">
                  <span>
                    Issues:{" "}
                    <strong className="text-foreground">
                      {repo._count.issues}
                    </strong>
                  </span>
                  <span>
                    Checklists:{" "}
                    <strong className="text-foreground">
                      {repo._count.checklists}
                    </strong>
                  </span>
                </div>

                <button
                  onClick={() => onSelectProject(repo.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-secondary border border-border text-secondary-foreground hover:border-accent hover:bg-secondary/90 transition cursor-pointer"
                >
                  Enter Workspace
                  <ArrowRight size={12} />
                </button>
              </div>

              {/* Heatmap in the last place of the card */}
              {repo.commitActivity && repo.commitActivity.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between select-none">
                  <span className="text-[10px] text-muted-foreground/50 font-medium flex items-center gap-1">
                    <GitCommit size={10} className="text-primary/95 shrink-0" />
                    7-Day Activity
                  </span>
                  <div className="flex gap-[3px] p-1 rounded-md bg-background/50 border border-border/40 shrink-0">
                    {getLast7DaysData(repo.commitActivity).map((day, idx) => {
                      let color = "bg-neutral-200 dark:bg-zinc-600/50";
                      if (day.count > 0 && day.count <= 2)
                        color = "bg-emerald-250 dark:bg-emerald-800";
                      if (day.count > 2 && day.count <= 5)
                        color = "bg-emerald-400 dark:bg-emerald-700";
                      if (day.count > 5 && day.count <= 9)
                        color = "bg-emerald-500 dark:bg-emerald-600";
                      if (day.count > 9)
                        color = "bg-emerald-700 dark:bg-emerald-400";

                      return (
                        <div
                          key={idx}
                          className={`w-[6px] h-[6px] rounded-[1.5px] ${color}`}
                          title={day.label}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
