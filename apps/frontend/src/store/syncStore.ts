import { create } from 'zustand'

export type SyncStatus = 'idle' | 'syncing' | 'error'

interface SyncState {
  status: SyncStatus
  sceneId: string | null
  sceneName: string | null
  setSyncStatus: (status: SyncStatus) => void
  setSceneId: (id: string | null) => void
  setSceneName: (name: string | null) => void
  clearSceneId: () => void
}

export const useSyncStore = create<SyncState>((set) => ({
  status: 'idle',
  sceneId: null,
  sceneName: null,
  setSyncStatus: (status) => set({ status }),
  setSceneId: (id) => set({ sceneId: id }),
  setSceneName: (name) => set({ sceneName: name }),
  clearSceneId: () => set({ sceneId: null, sceneName: null, status: 'idle' }),
}))
