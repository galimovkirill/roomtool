import type { SceneGroup, SceneItem } from '@/types'
import { apiClient } from './client'
import type { components } from './client'
import { useSyncStore } from '@/store/syncStore'
import { useSceneStore } from '@/store/sceneStore'

type ApiItem = components['schemas']['SceneItem']
type ApiGroup = components['schemas']['SceneGroup']

let _syncTimer: ReturnType<typeof setTimeout> | null = null

async function putScene(id: string, items: SceneItem[], groups: SceneGroup[]): Promise<boolean> {
  const { response } = await apiClient.PUT('/api/v1/scenes/{id}', {
    params: { path: { id } },
    body: {
      name: useSyncStore.getState().sceneName ?? 'Без названия',
      data: {
        version: 1,
        items: items as unknown as ApiItem[],
        groups: groups as unknown as ApiGroup[],
      },
    },
  })
  return response.status === 200
}

export async function initScene(sceneId: string): Promise<'ok' | 'not_found'> {
  const { setSceneId, setSceneName, setSyncStatus } = useSyncStore.getState()
  const { loadScene } = useSceneStore.getState()

  try {
    const { data, response } = await apiClient.GET('/api/v1/scenes/{id}', {
      params: { path: { id: sceneId } },
    })
    if (response.status === 200 && data) {
      loadScene(
        data.data.items as unknown as SceneItem[],
        data.data.groups as unknown as SceneGroup[]
      )
      setSceneId(sceneId)
      setSceneName(data.name)
      return 'ok'
    }
    return 'not_found'
  } catch {
    setSyncStatus('error')
    return 'not_found'
  }
}

export function cancelSync(): void {
  if (_syncTimer) {
    clearTimeout(_syncTimer)
    _syncTimer = null
  }
}

export function scheduleSync(items: SceneItem[], groups: SceneGroup[]): void {
  if (_syncTimer) clearTimeout(_syncTimer)
  _syncTimer = setTimeout(() => {
    _syncTimer = null
    const { sceneId, setSyncStatus } = useSyncStore.getState()
    if (!sceneId) return
    setSyncStatus('syncing')
    putScene(sceneId, items, groups)
      .then((ok) => {
        if (!ok) {
          console.error('[syncService] scheduleSync: PUT failed')
          setSyncStatus('error')
          return
        }
        setSyncStatus('idle')
      })
      .catch((err) => {
        console.error('[syncService] scheduleSync failed', err)
        setSyncStatus('error')
      })
  }, 1500)
}

export async function syncNow(): Promise<void> {
  if (_syncTimer) {
    clearTimeout(_syncTimer)
    _syncTimer = null
  }
  const { sceneId, setSyncStatus } = useSyncStore.getState()
  if (!sceneId) return
  const { items, groups } = useSceneStore.getState()
  setSyncStatus('syncing')
  try {
    await putScene(sceneId, items, groups)
    setSyncStatus('idle')
  } catch (err) {
    console.error('[syncService] syncNow failed', err)
    setSyncStatus('error')
  }
}

// Subscribe to store changes and debounce-sync to backend.
// Separated from sceneStore.ts to avoid circular dependency.
// Only fires when items or groups references change — ignores UI-only updates
// (selection, drag sessions, etc.) that don't need to be persisted.
useSceneStore.subscribe((state, prevState) => {
  if (state.items === prevState.items && state.groups === prevState.groups) return
  scheduleSync(state.items, state.groups)
})
