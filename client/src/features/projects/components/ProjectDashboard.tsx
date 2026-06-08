import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Folder, AlertCircle, Loader2, ArrowRight, Plus, RefreshCw } from 'lucide-react'
import { CommitHeatmap } from './CommitHeatmap'
import { IssuesBoard } from '../../tasks/components/IssuesBoard'
import { useSyncProject } from '../api/useSyncProject'

interface ProjectDashboardProps {
  selectedRepoId: string | null
  activeRepoDetails: any
  loadingDetails: boolean
  detailsError: any
  onAddIssueClick: () => void
  onImportClick: () => void
}

export function ProjectDashboard({
  selectedRepoId,
  activeRepoDetails,
  loadingDetails,
  detailsError,
  onAddIssueClick,
  onImportClick,
}: ProjectDashboardProps) {
  const navigate = useNavigate();
  const syncMutation = useSyncProject();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (!activeRepoDetails?.id || isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await syncMutation.mutateAsync(activeRepoDetails.id);
      if (res.status === 'DELETED') {
        alert('This repository has been deleted or is no longer accessible on GitHub, and has been removed from DevPulse.');
        navigate({ to: '/dashboard/projects' });
      } else {
        alert('Workspace synced successfully!');
      }
    } catch (err) {
      console.error('Failed to sync workspace:', err);
      alert('Failed to sync workspace. Please check your network connection or try again.');
    } finally {
      setIsSyncing(false);
    }
  };
  if (!selectedRepoId) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-4 text-left">
        <Folder size={40} className="text-muted-foreground/35 stroke-[1.2] self-center" />
        <div className="text-center">
          <h4 className="text-lg font-bold text-foreground">No active workspace</h4>
          <p className="text-muted-foreground text-sm mt-1">Please select an existing workspace from the left sidebar, or import a new repository to get started.</p>
        </div>
        <button
          onClick={onImportClick}
          className="self-center inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition cursor-pointer"
        >
          <Plus size={14} /> Import Repository
        </button>
      </div>
    );
  }

  if (loadingDetails) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3">
        <Loader2 size={36} className="animate-spin text-primary stroke-[1.5] self-center" />
        <span className="text-sm text-muted-foreground">Loading workspace analytics...</span>
      </div>
    );
  }

  if (detailsError || !activeRepoDetails) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-3">
        <AlertCircle size={32} className="text-destructive stroke-[1.5] self-center" />
        <span className="text-muted-foreground text-sm">Failed to load workspace details. Please try refreshing or check connection.</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      {/* Project Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border border-border bg-card/25 p-6 rounded-2xl text-left">
        <div className="flex items-center gap-4">
          {activeRepoDetails.imageUrl ? (
            <img
              src={activeRepoDetails.imageUrl}
              alt={activeRepoDetails.name}
              className="w-14 h-14 rounded-2xl bg-muted border border-border shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground shrink-0">
              <Folder size={24} />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl font-extrabold text-foreground leading-none">{activeRepoDetails.name}</h3>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full border ${
                activeRepoDetails.isPrivate
                  ? 'text-purple-400 bg-purple-500/5 border-purple-500/20'
                  : 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20'
              }`}>
                {activeRepoDetails.isPrivate ? 'Private' : 'Public'}
              </span>
            </div>
            <p className="text-muted-foreground text-xs mt-2.5 max-w-xl leading-relaxed">{activeRepoDetails.description || "No project description provided."}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl text-secondary-foreground border border-border bg-secondary hover:border-accent hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 cursor-pointer"
          >
            {isSyncing ? (
              <>
                <Loader2 size={12} className="animate-spin text-muted-foreground" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw size={12} className="text-muted-foreground" />
                Sync Workspace
              </>
            )}
          </button>

          <a
            href={activeRepoDetails.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl text-secondary-foreground border border-border bg-secondary hover:border-accent hover:bg-secondary/90 transition duration-150 cursor-pointer"
          >
            View GitHub Repository
            <ArrowRight size={12} />
          </a>
        </div>
      </div>

      {/* Commit Calendar Heatmap */}
      <CommitHeatmap commitActivity={activeRepoDetails.commitActivity} />

      {/* Issues Board */}
      <IssuesBoard 
        repoId={activeRepoDetails.id} 
        issues={activeRepoDetails.issues || []} 
        onAddIssueClick={onAddIssueClick} 
      />
    </div>
  );
}
