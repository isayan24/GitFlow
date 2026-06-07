import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ProjectList } from "../../features/projects/components/ProjectList";
import { useDashboardStore } from "@/store/useDashboardStore";

export const Route = createFileRoute("/dashboard/projects/")({
  component: ProjectsRoute,
});

function ProjectsRoute() {
  const setSelectedRepoId = useDashboardStore(
    (state) => state.setSelectedRepoId,
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
        navigate({ to: "/dashboard/discovery" });
      }}
    />
  );
}
