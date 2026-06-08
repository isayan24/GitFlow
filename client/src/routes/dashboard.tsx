import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { RedirectToSignIn, useAuth } from "@clerk/tanstack-react-start";
import { Loader2, CalendarDays } from "lucide-react";
import { useEffect } from "react";

// Layout/Sidebar imports
import { SidebarLeft } from "@/components/sidebar-left";
import { SidebarRight } from "@/components/sidebar-right";
import { Separator } from "#/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "#/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "#/components/ui/breadcrumb";

// Features API & Components
import { useSyncProfile } from "../features/auth/api/useSyncProfile";
import { useImportedProjects } from "../features/projects/api/useImportedProjects";
import { DiscoveryWizard } from "../features/projects/components/DiscoveryWizard";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

import { useAppStore } from "@/store/useAppStore";

function DashboardLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  const navigate = useNavigate();
  const showRightSidebar = useAppStore((state) => state.showRightSidebar);
  const setShowRightSidebar = useAppStore((state) => state.setShowRightSidebar);
  const selectedRepoId = useAppStore((state) => state.selectedRepoId);
  const setSelectedRepoId = useAppStore((state) => state.setSelectedRepoId);
  const showDiscoveryModal = useAppStore((state) => state.showDiscoveryModal);
  const setShowDiscoveryModal = useAppStore((state) => state.setShowDiscoveryModal);

  // TanStack Queries & Mutations
  const syncProfileMutation = useSyncProfile();
  const { data: importedRepos = [] } = useImportedProjects();

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
  }, [importedRepos, selectedRepoId, setSelectedRepoId]);

  // Guard: Redirect to sign-in if Clerk not completed yet
  if (isLoaded && !isSignedIn) {
    return <RedirectToSignIn />;
  }

  return (
    <SidebarProvider className="dark bg-background text-foreground flex min-h-screen">
      <SidebarLeft />
      <SidebarInset className="bg-background flex flex-col flex-1 min-w-0 border-l border-border">
        {/* Navigation Header */}
        <header className="sticky top-0 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/60 backdrop-blur-md px-4 z-40">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4 bg-border"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="line-clamp-1 text-muted-foreground font-semibold text-xs capitalize">
                    GitFlow Workspace
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2.5">
            {syncProfileMutation.isPending && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full border border-border animate-pulse">
                <Loader2 size={10} className="animate-spin text-primary" />
                Syncing profile...
              </span>
            )}

            {!showRightSidebar && (
              <button
                onClick={() => setShowRightSidebar(true)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent border border-border transition duration-150 cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title="Show Calendar Panel"
              >
                <CalendarDays size={14} className="text-primary" />
                <span>Show Calendar</span>
              </button>
            )}
          </div>
        </header>

        {/* Dashboard Content Workspace Area */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-background">
          <Outlet />
        </div>
      </SidebarInset>

      {showRightSidebar && <SidebarRight />}
      {showDiscoveryModal && (
        <DiscoveryWizard
          onClose={() => setShowDiscoveryModal(false)}
          onImportSuccess={(newRepoId) => {
            setSelectedRepoId(newRepoId);
            setShowDiscoveryModal(false);
            navigate({
              to: "/dashboard/projects/$projectId",
              params: { projectId: newRepoId },
            });
          }}
        />
      )}
    </SidebarProvider>
  );
}
