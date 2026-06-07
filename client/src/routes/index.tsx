import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth, SignInButton } from "@clerk/tanstack-react-start";
import { GitBranch, Activity, LayoutGrid, Zap } from "lucide-react";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white ">
      {/* Navbar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              GF
            </div>
            <span className="font-bold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
              GITFLOW
            </span>
          </div>

          <nav className="flex items-center gap-4">
            {!isLoaded ? (
              <div className="w-20 h-8 bg-slate-900/50 animate-pulse rounded-lg" />
            ) : !isSignedIn ? (
              <SignInButton mode="modal">
                <button className="px-4 py-2 text-sm font-semibold rounded-lg text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 transition duration-200 cursor-pointer">
                  Sign In
                </button>
              </SignInButton>
            ) : (
              <Link
                to="/dashboard"
                className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-600/20 transition duration-200"
              >
                Go to Dashboard
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/5 text-indigo-400 text-xs font-semibold tracking-wide mb-6 uppercase animate-pulse">
            <Zap size={12} /> Introducing GitFlow 1.0
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-none mb-6">
            Automate Your Developer Workspace
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Eliminate traditional manual cards. GitFlow bridges the gap between
            active code creation and project management by turning GitHub data
            into a live operational dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!isLoaded ? (
              <div className="w-48 h-14 bg-slate-900/50 animate-pulse rounded-xl" />
            ) : !isSignedIn ? (
              <SignInButton mode="modal">
                <button className="px-8 py-4 text-base font-bold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition duration-200 cursor-pointer">
                  Get Started with GitHub
                </button>
              </SignInButton>
            ) : (
              <Link
                to="/dashboard"
                className="px-8 py-4 text-base font-bold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition duration-200"
              >
                Enter Workspace Dashboard
              </Link>
            )}
          </div>
        </div>

        {/* Feature Cards Grid */}
        <section className="max-w-6xl mx-auto mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 w-full">
          {/* Card 1 */}
          <div className="p-8 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-sm hover:border-slate-800 transition duration-300 flex flex-col items-start text-left hover:shadow-lg hover:shadow-slate-950/80 group">
            <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition duration-300 mb-6">
              <GitBranch size={20} />
            </div>
            <h3 className="text-xl font-bold mb-3">Live GitHub Sync</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Import repositories in seconds. Pull requests, commits, and issue
              closures feed directly into your board pipelines.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-sm hover:border-slate-800 transition duration-300 flex flex-col items-start text-left hover:shadow-lg hover:shadow-slate-950/80 group">
            <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition duration-300 mb-6">
              <LayoutGrid size={20} />
            </div>
            <h3 className="text-xl font-bold mb-3">Hybrid Kanban Board</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Add non-code tasks (Figma designs, copywriting, DevOps) alongside
              automated GitHub cards under named sprint assignments.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-sm hover:border-slate-800 transition duration-300 flex flex-col items-start text-left hover:shadow-lg hover:shadow-slate-950/80 group">
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition duration-300 mb-6">
              <Activity size={20} />
            </div>
            <h3 className="text-xl font-bold mb-3">Project Commit Heatmaps</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Track your individual contribution frequency for specific projects
              with custom, isolated 365-day heatmaps.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-600 bg-slate-950/40 relative z-10">
        <p>
          &copy; {new Date().getFullYear()} GitFlow. All rights reserved.
          Automated Developer SaaS.
        </p>
      </footer>
    </div>
  );
}
