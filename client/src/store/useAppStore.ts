import { create } from 'zustand'
import { createLayoutSlice, type LayoutSlice } from './slices/layoutSlice'
import { createWorkspaceSlice, type WorkspaceSlice } from './slices/workspaceSlice'

export type { LayoutSlice, WorkspaceSlice }

export type AppState = LayoutSlice & WorkspaceSlice

export const useAppStore = create<AppState>()((...a) => ({
  ...createLayoutSlice(...a),
  ...createWorkspaceSlice(...a),
}))
