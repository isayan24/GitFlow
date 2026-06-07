import { create } from 'zustand'
import type { StateCreator } from 'zustand'

export interface LayoutSlice {
  showRightSidebar: boolean
  setShowRightSidebar: (show: boolean) => void
}

export interface WorkspaceSlice {
  selectedRepoId: string | null
  setSelectedRepoId: (id: string | null) => void
}

export type DashboardState = LayoutSlice & WorkspaceSlice

const createLayoutSlice: StateCreator<
  DashboardState,
  [],
  [],
  LayoutSlice
> = (set) => ({
  showRightSidebar: true,
  setShowRightSidebar: (show) => set({ showRightSidebar: show }),
})

const createWorkspaceSlice: StateCreator<
  DashboardState,
  [],
  [],
  WorkspaceSlice
> = (set) => ({
  selectedRepoId: null,
  setSelectedRepoId: (id) => set({ selectedRepoId: id }),
})

export const useDashboardStore = create<DashboardState>()((...a) => ({
  ...createLayoutSlice(...a),
  ...createWorkspaceSlice(...a),
}))
