"use client"

import * as React from "react"
import { Link, useLocation } from '@tanstack/react-router'
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar"
import { LayoutDashboard, Folder, Plus, GitBranch } from "lucide-react"

import { useImportedProjects } from "@/features/projects/api/useImportedProjects"
import { useAppStore } from "@/store/useAppStore"

export interface SidebarLeftProps extends React.ComponentProps<typeof Sidebar> {}

export function SidebarLeft({
  ...props
}: SidebarLeftProps) {
  const location = useLocation()
  const currentPath = location.pathname

  const { data: importedRepos = [] } = useImportedProjects()
  const setSelectedRepoId = useAppStore((state) => state.setSelectedRepoId)
  const setShowDiscoveryModal = useAppStore((state) => state.setShowDiscoveryModal)


  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar flex flex-col" {...props}>
      <SidebarHeader className="border-b border-sidebar-border pb-4">
        {/* Brand Info */}
        <div className="flex items-center gap-2 px-3 py-3">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-extrabold text-white text-xs shadow-md shadow-indigo-500/10">
            GF
          </div>
          <span className="font-extrabold text-sm tracking-widest text-sidebar-foreground">
            GITFLOW
          </span>
        </div>

        {/* Add Repository Action Button */}
        <div className="px-3 pt-1">
          <button
            onClick={() => setShowDiscoveryModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-sidebar-accent border border-sidebar-border hover:border-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80 transition duration-200 cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Repository</span>
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-col flex-1 min-h-0 bg-sidebar">
        {/* Main Navigation links */}
        <div className="px-3 py-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={currentPath === '/dashboard' || currentPath === '/dashboard/'} 
                render={<Link to="/dashboard" />}
                className="w-full text-sidebar-foreground/75 hover:text-sidebar-foreground"
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={currentPath === '/dashboard/projects'} 
                render={<Link to="/dashboard/projects" />}
                className="w-full text-sidebar-foreground/75 hover:text-sidebar-foreground"
              >
                <Folder size={16} />
                <span>Projects</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

          </SidebarMenu>
        </div>

        {/* Divider */}
        <div className="h-px bg-sidebar-border mx-6" />

        {/* Imported Projects List */}
        <div className="px-3 py-4 flex-1 overflow-y-auto no-scrollbar">
          <h5 className="px-3 text-2xs font-semibold text-sidebar-foreground/50 uppercase tracking-widest mb-3">
            Active Workspaces
          </h5>
          {importedRepos.length === 0 ? (
            <div className="px-3 py-4 text-xs text-sidebar-foreground/40 italic">
              No projects imported yet
            </div>
          ) : (
            <SidebarMenu className="gap-1">
              {importedRepos.map((repo: any) => {
                const isActiveProject = currentPath === `/dashboard/projects/${repo.id}`;
                return (
                  <SidebarMenuItem key={repo.id}>
                    <SidebarMenuButton
                      isActive={isActiveProject}
                      onClick={() => {
                        setSelectedRepoId(repo.id);
                      }}
                      render={<Link to="/dashboard/projects/$projectId" params={{ projectId: repo.id }} />}
                      className="w-full justify-between"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {repo.imageUrl ? (
                          <img
                            src={repo.imageUrl}
                            alt={repo.name}
                            className="w-5 h-5 rounded bg-sidebar border border-sidebar-border"
                          />
                        ) : (
                          <GitBranch size={14} className="text-sidebar-foreground/50" />
                        )}
                        <span className="truncate">{repo.name}</span>
                      </div>
                      <span className="text-3xs bg-sidebar-accent text-sidebar-foreground/60 border border-sidebar-border px-1.5 py-0.5 rounded-full shrink-0">
                        {repo._count?.issues || 0}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          )}
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2 bg-sidebar">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
