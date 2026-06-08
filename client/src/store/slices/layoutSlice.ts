import type { StateCreator } from "zustand";
import type { AppState } from "../useAppStore";

export interface LayoutSlice {
  showRightSidebar: boolean;
  setShowRightSidebar: (show: boolean) => void;
  showDiscoveryModal: boolean;
  setShowDiscoveryModal: (show: boolean) => void;
}

export const createLayoutSlice: StateCreator<AppState, [], [], LayoutSlice> = (
  set,
) => ({
  showRightSidebar: true,
  setShowRightSidebar: (show) => set({ showRightSidebar: show }),
  showDiscoveryModal: false,
  setShowDiscoveryModal: (show) => set({ showDiscoveryModal: show }),
});
