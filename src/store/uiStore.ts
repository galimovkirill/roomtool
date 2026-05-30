import { create } from 'zustand'

interface UIState {
  sceneMode: '2d' | '3d'
  setSceneMode: (mode: '2d' | '3d') => void
}

export const useUIStore = create<UIState>((set) => ({
  sceneMode: '3d',
  setSceneMode: (mode) => set({ sceneMode: mode }),
}))
