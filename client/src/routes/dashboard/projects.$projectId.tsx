import {
  createFileRoute,
  useParams,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useProjectDetails } from "../../features/projects/api/useProjectDetails";
import { ProjectDashboard } from "../../features/projects/components/ProjectDashboard";
import { AddIssueModal } from "../../features/tasks/components/AddIssueModal";
import { useAppStore } from "@/store/useAppStore";

export const Route = createFileRoute("/dashboard/projects/$projectId")({
  component: ProjectDetailsRoute,
});

function ProjectDetailsRoute() {
  const { projectId } = useParams({ from: "/dashboard/projects/$projectId" });
  const setSelectedRepoId = useAppStore(
    (state) => state.setSelectedRepoId,
  );
  const setShowDiscoveryModal = useAppStore(
    (state) => state.setShowDiscoveryModal,
  );

  const [showAddIssueModal, setShowAddIssueModal] = useState(false);

  // Sync active project selection in the left sidebar layout
  useEffect(() => {
    if (projectId) {
      setSelectedRepoId(projectId);
    }
  }, [projectId, setSelectedRepoId]);

  const {
    data: activeRepoDetails,
    isLoading: loadingDetails,
    error: detailsError,
  } = useProjectDetails(projectId);

  return (
    <>
      <ProjectDashboard
        selectedRepoId={projectId}
        activeRepoDetails={activeRepoDetails}
        loadingDetails={loadingDetails}
        detailsError={detailsError}
        onAddIssueClick={() => setShowAddIssueModal(true)}
        onImportClick={() => setShowDiscoveryModal(true)}
      />

      {showAddIssueModal && projectId && (
        <AddIssueModal
          repoId={projectId}
          onClose={() => setShowAddIssueModal(false)}
        />
      )}
    </>
  );
}
