import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/tanstack-react-start'
import { useSyncProfile } from '../../auth/api/useSyncProfile'
import { useImportedProjects } from '../api/useImportedProjects'
import { useProjectDetails } from '../api/useProjectDetails'

export function useDashboardState() {
  const { isLoaded, isSignedIn } = useAuth();

  // Navigation states
  const [activeView, setActiveView] = useState<'dashboard' | 'projects' | 'issues' | 'add-repo'>('dashboard');
  const [showRightSidebar, setShowRightSidebar] = useState(true);

  // Selected Repository state
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  
  // Modal state
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  // TanStack Queries & Mutations
  const syncProfileMutation = useSyncProfile();
  const { data: importedRepos = [] } = useImportedProjects();
  const { data: activeRepoDetails, isLoading: loadingDetails, error: detailsError } = useProjectDetails(selectedRepoId);

  // Sync profile on mount
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      syncProfileMutation.mutate();
    }
  }, [isLoaded, isSignedIn]);

  // Set default selected project when loaded
  useEffect(() => {
    if (importedRepos.length > 0 && !selectedRepoId) {
      setSelectedRepoId(importedRepos[0].id);
    }
  }, [importedRepos]);

  return {
    isLoaded,
    isSignedIn,
    activeView,
    setActiveView,
    showRightSidebar,
    setShowRightSidebar,
    selectedRepoId,
    setSelectedRepoId,
    showAddTaskModal,
    setShowAddTaskModal,
    importedRepos,
    activeRepoDetails,
    loadingDetails,
    detailsError,
    syncProfilePending: syncProfileMutation.isPending,
  };
}
