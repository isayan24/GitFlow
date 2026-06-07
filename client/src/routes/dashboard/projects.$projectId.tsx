import {
  createFileRoute,
  useParams,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useProjectDetails } from "../../features/projects/api/useProjectDetails";
import { ProjectDashboard } from "../../features/projects/components/ProjectDashboard";
import { AddTaskModal } from "../../features/tasks/components/AddTaskModal";
import { useDashboardStore } from "@/store/useDashboardStore";

export const Route = createFileRoute("/dashboard/projects/$projectId")({
  component: ProjectDetailsRoute,
});

function ProjectDetailsRoute() {
  const { projectId } = useParams({ from: "/dashboard/projects/$projectId" });
  const setSelectedRepoId = useDashboardStore(
    (state) => state.setSelectedRepoId,
  );
  const navigate = useNavigate();

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

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
        onAddTaskClick={() => setShowAddTaskModal(true)}
        onImportClick={() => navigate({ to: "/dashboard/discovery" })}
      />

      {showAddTaskModal && projectId && (
        <AddTaskModal
          repoId={projectId}
          onClose={() => setShowAddTaskModal(false)}
        />
      )}
    </>
  );
}
