import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { apiClient } from '@/api/client'
import type { components } from '@/api/client'
import { AppHeader } from '@/components/ui/AppHeader'
import { SceneCard } from '@/components/files/SceneCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

type SceneSummary = components['schemas']['SceneSummary']
type Scene = components['schemas']['Scene']

type SortKey = 'updatedAt' | 'createdAt' | 'name'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'updatedAt', label: 'Последнее изменение' },
  { key: 'createdAt', label: 'Дата создания' },
  { key: 'name', label: 'По названию' },
]

function sortScenes(scenes: SceneSummary[], key: SortKey): SceneSummary[] {
  return [...scenes].sort((a, b) => {
    if (key === 'name') return a.name.localeCompare(b.name, 'ru')
    return new Date(b[key]).getTime() - new Date(a[key]).getTime()
  })
}

export function FilesPage() {
  const navigate = useNavigate()
  const [scenes, setScenes] = useState<SceneSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt')
  const [loadTick, setLoadTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setLoadError(false)
      const { data, error } = await apiClient.GET('/api/v1/scenes')
      if (cancelled) return
      if (error || !data) {
        setLoadError(true)
        toast.error('Не удалось загрузить список сцен')
      } else {
        setScenes(data)
      }
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [loadTick])

  async function handleCreateScene() {
    const { data, error } = await apiClient.POST('/api/v1/scenes', {
      body: { name: 'Без названия', data: { version: 1, items: [], groups: [] } },
    })
    if (error || !data) {
      toast.error('Не удалось создать сцену')
      return
    }
    navigate(`/editor/${data.id}`)
  }

  function handleRename(id: string, name: string) {
    setScenes((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)))
  }

  function handleDuplicate(scene: Scene) {
    setScenes((prev) => [scene, ...prev])
  }

  function handleDelete(id: string) {
    setScenes((prev) => prev.filter((s) => s.id !== id))
  }

  function handleShareTokenChange(id: string, token: string | null) {
    setScenes((prev) => prev.map((s) => (s.id === id ? { ...s, share_token: token } : s)))
  }

  const sorted = sortScenes(scenes, sortKey)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">Мои файлы</h1>
          <Button onClick={handleCreateScene}>Создать сцену</Button>
        </div>

        <div className="flex gap-2 mb-6">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortKey(opt.key)}
              className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                sortKey === opt.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-lg border overflow-hidden">
                <Skeleton className="aspect-video" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && loadError && (
          <div className="text-center py-24 text-muted-foreground">
            <p className="mb-4">Не удалось загрузить файлы</p>
            <Button variant="outline" onClick={() => setLoadTick((t) => t + 1)}>
              Повторить
            </Button>
          </div>
        )}

        {!loading && !loadError && sorted.length === 0 && (
          <div className="text-center py-24 text-muted-foreground">
            <p className="mb-4">У вас ещё нет файлов</p>
            <Button onClick={handleCreateScene}>Создать первую сцену</Button>
          </div>
        )}

        {!loading && !loadError && sorted.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sorted.map((scene) => (
              <SceneCard
                key={scene.id}
                scene={scene}
                onRename={handleRename}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onShareTokenChange={handleShareTokenChange}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
