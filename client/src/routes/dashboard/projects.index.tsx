import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ProjectList } from "../../features/projects/components/ProjectList";
import { useAppStore } from "@/store/useAppStore";

export const Route = createFileRoute("/dashboard/projects/")({
  component: ProjectsRoute,
});

function ProjectsRoute() {
  const setSelectedRepoId = useAppStore(
    (state) => state.setSelectedRepoId,
  );
  const setShowDiscoveryModal = useAppStore(
    (state) => state.setShowDiscoveryModal,
  );
  const navigate = useNavigate();

  return (
    <ProjectList
      onSelectProject={(id) => {
        setSelectedRepoId(id);
        navigate({
          to: "/dashboard/projects/$projectId",
          params: { projectId: id },
        });
      }}
      onImportClick={() => {
        setShowDiscoveryModal(true);
      }}
    />
  );
}
