import type { SceneGroup, SceneItem } from '@/types'

function storageKey(sceneId: string): string {
  return `roomtool_scene_${sceneId}_v1`
}

export interface SceneSnapshot {
  version: 1
  items: SceneItem[]
  groups: SceneGroup[]
}

export function saveScene(snapshot: SceneSnapshot, sceneId: string): void {
  try {
    localStorage.setItem(storageKey(sceneId), JSON.stringify(snapshot))
  } catch {
    // localStorage may be unavailable (private mode, quota exceeded)
  }
}

export function loadScene(sceneId: string): SceneSnapshot | null {
  try {
    const raw = localStorage.getItem(storageKey(sceneId))
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

export function clearScene(sceneId: string): void {
  localStorage.removeItem(storageKey(sceneId))
}
