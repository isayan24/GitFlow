import { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  GitBranch,
  CheckCircle,
  X,
  Github,
} from "lucide-react";
import { useUserGithubRepos } from "../api/useUserGithubRepos";
import { useImportedProjects } from "../api/useImportedProjects";
import { useImportProject } from "../api/useImportProject";
import { getLanguageIcon } from "../libs/getLanguageIcon";

interface DiscoveryWizardProps {
  onClose: () => void;
  onImportSuccess: (importedRepoId: string) => void;
}

export function DiscoveryWizard({
  onClose,
  onImportSuccess,
}: DiscoveryWizardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search query to avoid calling API too frequently
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const {
    data,
    isLoading: loadingRepos,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUserGithubRepos(debouncedSearch);

  const { data: importedRepos = [] } = useImportedProjects();
  const importMutation = useImportProject();

  // Flatten the pages of repositories
  const githubRepos = data?.pages.flat() || [];

  const handleImport = async (repo: any) => {
    try {
      const newRepo = await importMutation.mutateAsync({
        githubRepoId: repo.id,
        name: repo.name,
        owner: repo.owner,
        description: repo.description,
        url: repo.url,
        isPrivate: repo.isPrivate,
        imageUrl: repo.ownerAvatarUrl,
      });
      onImportSuccess(newRepo.id);
    } catch (error) {
      console.error("Error importing project:", error);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    // If we're within 60px of the bottom, fetch the next page
    if (
      target.scrollHeight - target.scrollTop <= target.clientHeight + 60 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-xl flex flex-col max-h-[75vh] text-left animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Import a Repository
            </h3>
            <p className="text-muted-foreground text-3xs mt-1">
              Search and select a repository from your GitHub account.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent hover:border-border transition duration-150 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Input Area */}
        <div className="px-6 py-4 border-b border-border/60 bg-muted/10">
          <div className="relative">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50"
              size={14}
            />
            <input
              type="text"
              placeholder="Search repository name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card focus:border-primary transition duration-150 text-xs placeholder:text-muted-foreground/30 text-foreground outline-none"
            />
          </div>
        </div>

        {/* Scrollable Repository List */}
        <div
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto no-scrollbar p-6 flex flex-col gap-2"
        >
          {loadingRepos ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2
                size={28}
                className="animate-spin text-primary stroke-[1.5]"
              />
              <span className="text-xs text-muted-foreground">
                Retrieving repositories from GitHub...
              </span>
            </div>
          ) : githubRepos.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-3">
              <GitBranch
                size={28}
                className="text-muted-foreground/35 stroke-[1.5] self-center"
              />
              <span className="text-muted-foreground text-xs font-semibold">
                {searchQuery
                  ? "No matching repositories found"
                  : "No repositories returned from your account"}
              </span>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                {githubRepos.map((repo: any) => {
                  const isImported = importedRepos.some(
                    (i: any) => i.id === repo.id || i.githubRepoId === repo.id,
                  );
                  const isImporting =
                    importMutation.isPending &&
                    importMutation.variables?.githubRepoId === repo.id;

                  return (
                    <div
                      key={repo.id}
                      className="flex items-center justify-between p-2.5 px-4 rounded-xl border border-border bg-card/45 backdrop-blur-sm hover:border-accent hover:bg-card/75 transition duration-150 gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {getLanguageIcon(repo.language, repo.name) ? (
                          <img
                            src={getLanguageIcon(repo.language, repo.name)!}
                            alt={repo.language}
                            className="w-6 h-6 rounded bg-muted border border-border object-center shrink-0"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded bg-muted border border-border flex items-center justify-center shrink-0 text-foreground/70">
                            <Github size={12} />
                          </div>
                        )}
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-foreground truncate">
                            {repo.name}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full border shrink-0 font-semibold ${
                              repo.isPrivate
                                ? "text-purple-400 bg-purple-500/5 border-purple-500/20"
                                : "text-emerald-400 bg-emerald-500/5 border-emerald-500/20"
                            }`}
                          >
                            {repo.isPrivate ? "Private" : "Public"}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 ml-2">
                        {isImported ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/25">
                            <CheckCircle
                              size={10}
                              className="text-emerald-400"
                            />
                            Imported
                          </span>
                        ) : (
                          <button
                            onClick={() => handleImport(repo)}
                            disabled={isImporting}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition duration-155 cursor-pointer disabled:opacity-50"
                          >
                            {isImporting ? (
                              <>
                                <Loader2
                                  size={10}
                                  className="animate-spin animate-spin-slow animate-pulse"
                                />
                                <span>Syncing...</span>
                              </>
                            ) : (
                              <span>Import</span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Infinite scroll pagination loader */}
              {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <Loader2 size={20} className="animate-spin text-primary" />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
