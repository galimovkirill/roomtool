import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { apiClient } from '@/api/client'
import type { components } from '@/api/client'
import { useSceneStore } from '@/store/sceneStore'
import { SceneCanvas } from '@/components/scene/SceneCanvas'
import { ViewModeToggle } from '@/components/scene/ribbon/ViewModeToggle'
import type { SceneItem, SceneGroup, RoomDimensions } from '@/types'

type Scene = components['schemas']['Scene']

type LoadState = 'loading' | 'error' | 'success'

export function ShareViewerPage() {
  const { token } = useParams<{ token: string }>()
  const [loadState, setLoadState] = useState<LoadState>(token ? 'loading' : 'error')
  const [sceneName, setSceneName] = useState('')

  useEffect(() => {
    if (!token) return

    let cancelled = false

    async function load() {
      const { data, response } = await apiClient.GET('/api/v1/share/{token}', {
        params: { path: { token: token! } },
      })
      if (cancelled) return

      if (response.status !== 200 || !data) {
        setLoadState('error')
        return
      }

      const scene = data as Scene
      useSceneStore
        .getState()
        .loadScene(
          scene.data.items as unknown as SceneItem[],
          scene.data.groups as unknown as SceneGroup[],
          scene.data.room as RoomDimensions | undefined
        )
      setSceneName(scene.name)
      setLoadState('success')
    }

    load()

    return () => {
      cancelled = true
      useSceneStore.getState().resetScene()
    }
  }, [token])

  if (loadState === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-lg font-medium">Ссылка недействительна</p>
        <p className="text-sm text-muted-foreground">
          Возможно, ссылка была отозвана или никогда не существовала.
        </p>
        <Link
          to="/files"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Открыть RoomTool
        </Link>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-10 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
        <span className="truncate text-sm font-medium text-gray-700">{sceneName}</span>
        <ViewModeToggle />
      </header>
      <div className="flex flex-1 overflow-hidden">
        <SceneCanvas viewOnly />
      </div>
    </div>
  )
}
