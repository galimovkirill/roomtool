import type { SceneGroup, SceneItem } from '@/types'

const STORAGE_KEY = 'roomtool_scene_v1'

export interface SceneSnapshot {
  version: 1
  items: SceneItem[]
  groups: SceneGroup[]
}

export function saveScene(snapshot: SceneSnapshot): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // localStorage may be unavailable (private mode, quota exceeded)
  }
}

export function loadScene(): SceneSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.version !== 1 || !Array.isArray(parsed?.items) || !Array.isArray(parsed?.groups)) {
      console.warn('[roomtool] Incompatible scene snapshot, starting fresh')
      return null
    }
    return parsed as SceneSnapshot
  } catch {
    return null
  }
}

export function clearScene(): void {
  localStorage.removeItem(STORAGE_KEY)
}
