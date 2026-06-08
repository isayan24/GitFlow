import type { StateCreator } from 'zustand'
import type { AppState } from '../useAppStore'

export interface WorkspaceSlice {
  selectedRepoId: string | null
  setSelectedRepoId: (id: string | null) => void
}

export const createWorkspaceSlice: StateCreator<
  AppState,
  [],
  [],
  WorkspaceSlice
> = (set) => ({
  selectedRepoId: null,
  setSelectedRepoId: (id) => set({ selectedRepoId: id }),
})
