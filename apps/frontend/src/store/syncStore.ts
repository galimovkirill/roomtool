import { create } from 'zustand'

export type SyncStatus = 'idle' | 'syncing' | 'error'

const SCENE_ID_KEY = 'roomtool_scene_id_v1'

interface SyncState {
  status: SyncStatus
  sceneId: string | null
  setSyncStatus: (status: SyncStatus) => void
  setSceneId: (id: string) => void
}

export const useSyncStore = create<SyncState>((set) => ({
  status: 'idle',
  sceneId: localStorage.getItem(SCENE_ID_KEY),
  setSyncStatus: (status) => set({ status }),
  setSceneId: (id) => {
    localStorage.setItem(SCENE_ID_KEY, id)
    set({ sceneId: id })
  },
}))
