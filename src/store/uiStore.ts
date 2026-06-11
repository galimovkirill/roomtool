import { create } from 'zustand'

interface UIState {
  sceneMode: '2d' | '3d'
  setSceneMode: (mode: '2d' | '3d') => void
  activeRightPanelTab: 'catalog' | 'layers'
  setActiveRightPanelTab: (tab: 'catalog' | 'layers') => void
  showGizmo: boolean
  toggleGizmo: () => void
  showCeilingLight: boolean
  toggleCeilingLight: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sceneMode: '3d',
  setSceneMode: (mode) => set({ sceneMode: mode }),
  activeRightPanelTab: 'catalog',
  setActiveRightPanelTab: (tab) => set({ activeRightPanelTab: tab }),
  showGizmo: true,
  toggleGizmo: () => set((s) => ({ showGizmo: !s.showGizmo })),
  showCeilingLight: true,
  toggleCeilingLight: () => set((s) => ({ showCeilingLight: !s.showCeilingLight })),
}))
