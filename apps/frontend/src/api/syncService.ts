import type { SceneGroup, SceneItem } from '@/types'
import { apiClient } from './client'
import type { components } from './client'
import { useSyncStore } from '@/store/syncStore'
import { useSceneStore } from '@/store/sceneStore'

type ApiItem = components['schemas']['SceneItem']
type ApiGroup = components['schemas']['SceneGroup']

let _syncTimer: ReturnType<typeof setTimeout> | null = null

async function createScene(items: SceneItem[], groups: SceneGroup[]): Promise<string | null> {
  const { data } = await apiClient.POST('/api/v1/scenes', {
    body: {
      name: 'Мой проект',
      data: {
        version: 1,
        items: items as unknown as ApiItem[],
        groups: groups as unknown as ApiGroup[],
      },
    },
  })
  return data?.id ?? null
}

async function putScene(id: string, items: SceneItem[], groups: SceneGroup[]): Promise<boolean> {
  const { response } = await apiClient.PUT('/api/v1/scenes/{id}', {
    params: { path: { id } },
    body: {
      name: 'Мой проект',
      data: {
        version: 1,
        items: items as unknown as ApiItem[],
        groups: groups as unknown as ApiGroup[],
      },
    },
  })
  return response.status === 200
}

export async function initScene(): Promise<void> {
  const { sceneId, setSceneId } = useSyncStore.getState()
  const { loadScene } = useSceneStore.getState()

  if (sceneId) {
    try {
      const { data, response } = await apiClient.GET('/api/v1/scenes/{id}', {
        params: { path: { id: sceneId } },
      })
      if (response.status === 200 && data) {
        loadScene(
          data.data.items as unknown as SceneItem[],
          data.data.groups as unknown as SceneGroup[]
        )
        return
      }
      if (response.status === 404) {
        // sceneId устарел — создать новую
        const { items, groups } = useSceneStore.getState()
        const newId = await createScene(items, groups)
        if (newId) setSceneId(newId)
      }
    } catch {
      // Сеть недоступна — оставить данные из localStorage
      console.error('[syncService] initScene: network error, using localStorage data')
    }
    return
  }

  // sceneId нет — создать новую сцену
  try {
    const { items, groups } = useSceneStore.getState()
    const newId = await createScene(items, groups)
    if (newId) setSceneId(newId)
  } catch (err) {
    console.error('[syncService] initScene: failed to create scene', err)
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
    const { sceneId, setSyncStatus, setSceneId } = useSyncStore.getState()
    if (!sceneId) return
    setSyncStatus('syncing')
    putScene(sceneId, items, groups)
      .then((ok) => {
        if (!ok) {
          return createScene(items, groups).then((newId) => {
            if (newId) {
              setSceneId(newId)
              return putScene(newId, items, groups)
            }
          })
        }
      })
      .then(() => setSyncStatus('idle'))
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
  const { sceneId, setSyncStatus, setSceneId } = useSyncStore.getState()
  if (!sceneId) return
  const { items, groups } = useSceneStore.getState()
  setSyncStatus('syncing')
  try {
    const ok = await putScene(sceneId, items, groups)
    if (!ok) {
      const newId = await createScene(items, groups)
      if (newId) {
        setSceneId(newId)
        await putScene(newId, items, groups)
      }
    }
    setSyncStatus('idle')
  } catch (err) {
    console.error('[syncService] syncNow failed', err)
    setSyncStatus('error')
  }
}

// Subscribe to store changes and debounce-sync to backend.
// Separated from sceneStore.ts to avoid circular dependency.
useSceneStore.subscribe((state) => {
  scheduleSync(state.items, state.groups)
})
