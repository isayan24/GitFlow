import { createFileRoute, Link } from "@tanstack/react-router";
import {
  useAuth,
  useUser,
  UserButton,
  RedirectToSignIn,
  SignOutButton,
} from "@clerk/tanstack-react-start";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  GitBranch,
  Folder,
  Search,
  Loader2,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

interface GithubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  isPrivate: boolean;
  owner: string;
  ownerAvatarUrl: string;
}

interface ImportedRepo {
  id: string;
  githubRepoId: number;
  name: string;
  owner: string;
  description: string | null;
  url: string;
  isPrivate: boolean;
  imageUrl: string | null;
  _count: {
    tasks: number;
    assignments: number;
  };
}

function Dashboard() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  // App States
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "syncing" | "success" | "error"
  >("idle");
  const [githubRepos, setGithubRepos] = useState<GithubRepo[]>([]);
  const [importedRepos, setImportedRepos] = useState<ImportedRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [importingId, setImportingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // 1. Sync User Profile in Database on Mount
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const performSync = async () => {
        try {
          setSyncStatus("syncing");
          const token = await getToken();

          console.log(token, "token");

          await axios.post(
            `${API_URL}/api/auth/sync`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          setSyncStatus("success");
          // Fetch repos after user is successfully synced in database
          fetchUserGithubRepos();
          fetchImportedRepos();
        } catch (error) {
          console.error("Error syncing user profile:", error);
          setSyncStatus("error");
          setErrorMessage("Failed to sync user profile with database.");
        }
      };

      performSync();
    }
  }, [isLoaded, isSignedIn]);

  // 2. Fetch User's Repositories from GitHub (via our Express Backend)
  const fetchUserGithubRepos = async () => {
    try {
      setLoadingRepos(true);
      const token = await getToken();
      const response = await axios.get(`${API_URL}/api/github/repos`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.status === "SUCCESS") {
        setGithubRepos(response.data.repositories);
      }
    } catch (error) {
      console.error("Error fetching user GitHub repos:", error);
      setErrorMessage("Failed to load repositories from GitHub.");
    } finally {
      setLoadingRepos(false);
    }
  };

  // 3. Fetch Already Imported Repositories
  const fetchImportedRepos = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(`${API_URL}/api/repositories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.status === "SUCCESS") {
        setImportedRepos(response.data.repositories);
      }
    } catch (error) {
      console.error("Error fetching imported repos:", error);
    }
  };

  // 4. Trigger Repository Import (Online Sync)
  const handleImportRepo = async (repo: GithubRepo) => {
    try {
      setImportingId(repo.id);
      const token = await getToken();

      const response = await axios.post(
        `${API_URL}/api/repositories/import`,
        {
          githubRepoId: repo.id,
          name: repo.name,
          owner: repo.owner,
          description: repo.description,
          url: repo.url,
          isPrivate: repo.isPrivate,
          imageUrl: repo.ownerAvatarUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data?.status === "SUCCESS") {
        // Refetch imported repos
        fetchImportedRepos();
      }
    } catch (error) {
      console.error("Error importing repository:", error);
      setErrorMessage(
        "Failed to import project. Please check backend connections.",
      );
    } finally {
      setImportingId(null);
    }
  };

  // Guard: Redirect to sign-in if not signed in
  if (isLoaded && !isSignedIn) {
    return <RedirectToSignIn />;
  }

  // Filter Repositories by Search Query
  const filteredRepos = githubRepos.filter(
    (repo) =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.owner.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-80 border-r border-slate-900 bg-slate-950 flex flex-col">
        {/* Brand */}
        <div className="h-16 px-6 border-b border-slate-900 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white">
            GF
          </div>
          <span className="font-bold text-base tracking-wider text-slate-200">
            GITFLOW
          </span>

          <SignOutButton />
        </div>

        {/* User Card */}
        <div className="p-6 border-b border-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserButton />
            <div className="text-left">
              <h4 className="text-sm font-bold text-slate-200 leading-tight">
                {user?.fullName || "Developer"}
              </h4>
              <span className="text-xs text-slate-500">
                @{user?.username || "user"}
              </span>
            </div>
          </div>
        </div>

        {/* Mapped Imported Projects */}
        <div className="flex-1 p-6 overflow-y-auto">
          <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
            Imported Projects
          </h5>
          {importedRepos.length === 0 ? (
            <div className="text-sm text-slate-600 flex flex-col items-center justify-center py-10 gap-2">
              <Folder size={24} className="stroke-[1.5]" />
              <span>No projects imported yet</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {importedRepos.map((repo) => (
                <div
                  key={repo.id}
                  className="p-3 rounded-lg border border-slate-900 hover:border-slate-800 bg-slate-950/50 hover:bg-slate-900/40 transition duration-150 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    {repo.imageUrl ? (
                      <img
                        src={repo.imageUrl}
                        alt={repo.name}
                        className="w-7 h-7 rounded bg-slate-900 border border-slate-800"
                      />
                    ) : (
                      <Folder size={16} className="text-slate-500" />
                    )}
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-300 leading-none">
                        {repo.name}
                      </p>
                      <span className="text-2xs text-slate-600 leading-none">
                        {repo.owner}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-3xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                    <span>{repo._count.tasks} Tasks</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="p-6 border-t border-slate-900">
          <Link
            to="/"
            className="text-xs text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1.5"
          >
            ← Back to Landing Page
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Navigation Bar */}
        <header className="h-16 border-b border-slate-900 px-8 flex items-center justify-between bg-slate-950/50 backdrop-blur-md">
          <h2 className="font-bold text-lg text-slate-200">
            Repository Discovery Wizard
          </h2>

          <div className="flex items-center gap-2">
            {syncStatus === "syncing" && (
              <span className="text-xs text-slate-500 flex items-center gap-1.5 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                <Loader2 size={12} className="animate-spin text-indigo-500" />
                Syncing Clerk profile...
              </span>
            )}
            {syncStatus === "success" && (
              <span className="text-xs text-emerald-500 flex items-center gap-1.5 bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle size={12} />
                Profile Linked to DB
              </span>
            )}
          </div>
        </header>

        {/* Main Workspace Screen */}
        <div className="flex-1 p-8 overflow-y-auto">
          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm flex items-center gap-3 justify-between">
              <div className="flex items-center gap-2.5">
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage("")}
                className="text-xs font-semibold underline hover:text-red-300 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Search Header */}
          <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col gap-1.5 text-left">
              <h3 className="text-2xl font-extrabold tracking-tight">
                Import a Repository
              </h3>
              <p className="text-slate-400 text-sm">
                Search and select a repository from your GitHub account to stand
                up an automated project workspace.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                size={16}
              />
              <input
                type="text"
                placeholder="Search repository name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-900 bg-slate-950/60 focus:border-indigo-500 focus:bg-slate-950 transition duration-150 text-sm placeholder:text-slate-600 outline-none"
              />
            </div>

            {/* Repository Grid */}
            {loadingRepos ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2
                  size={36}
                  className="animate-spin text-indigo-500 stroke-[1.5]"
                />
                <span className="text-sm text-slate-500">
                  Retrieving repositories from GitHub...
                </span>
              </div>
            ) : filteredRepos.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-slate-900 rounded-2xl flex flex-col items-center justify-center gap-3">
                <GitBranch size={32} className="text-slate-700 stroke-[1.5]" />
                <span className="text-slate-500 text-sm">
                  {searchQuery
                    ? "No matching repositories found"
                    : "No repositories returned from your account"}
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRepos.map((repo) => {
                  const isImported = importedRepos.some(
                    (i) => i.githubRepoId === repo.id,
                  );
                  const isImporting = importingId === repo.id;

                  return (
                    <div
                      key={repo.id}
                      className="p-5 rounded-xl border border-slate-900 hover:border-slate-800 bg-slate-950/40 backdrop-blur-sm flex flex-col justify-between transition duration-150 hover:shadow-lg hover:shadow-slate-950/40"
                    >
                      <div className="text-left flex items-start gap-4">
                        <img
                          src={repo.ownerAvatarUrl}
                          alt={repo.owner}
                          className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base text-slate-200 truncate leading-none">
                              {repo.name}
                            </h4>
                            <span
                              className={`text-3xs px-2 py-0.5 rounded-full border ${
                                repo.isPrivate
                                  ? "text-purple-400 bg-purple-500/5 border-purple-500/20"
                                  : "text-emerald-400 bg-emerald-500/5 border-emerald-500/20"
                              }`}
                            >
                              {repo.isPrivate ? "Private" : "Public"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1.5 truncate">
                            {repo.description || "No description provided."}
                          </p>
                          <span className="text-3xs text-slate-600 mt-3 block">
                            Owned by @{repo.owner}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-900/60 flex items-center justify-between">
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                        >
                          View on GitHub ↗
                        </a>

                        {isImported ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-500/5 border border-emerald-500/20">
                            <CheckCircle size={12} />
                            Imported
                          </span>
                        ) : (
                          <button
                            onClick={() => handleImportRepo(repo)}
                            disabled={isImporting}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-white bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-900 disabled:opacity-50 transition duration-150 cursor-pointer"
                          >
                            {isImporting ? (
                              <>
                                <Loader2 size={12} className="animate-spin" />
                                Syncing...
                              </>
                            ) : (
                              <>
                                Import Project
                                <ArrowRight size={12} />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
