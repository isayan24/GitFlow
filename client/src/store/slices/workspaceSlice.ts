import type { StateCreator } from 'zustand'
import type { AppState } from '../useAppStore'

const getTodayDateStr = () => {
  return new Date().toISOString().slice(0, 10);
};

export interface WorkspaceSlice {
  selectedRepoId: string | null
  setSelectedRepoId: (id: string | null) => void
  selectedDateStr: string
  setSelectedDateStr: (dateStr: string) => void
}

export const createWorkspaceSlice: StateCreator<
  AppState,
  [],
  [],
  WorkspaceSlice
> = (set) => ({
  selectedRepoId: null,
  setSelectedRepoId: (id) => set({ selectedRepoId: id }),
  selectedDateStr: getTodayDateStr(),
  setSelectedDateStr: (dateStr) => set({ selectedDateStr: dateStr }),
})
