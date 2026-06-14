import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AppLayout } from '@/components/ui/AppLayout'
import { SceneRibbon } from '@/components/scene/SceneRibbon'
import { SceneCanvas } from '@/components/scene/SceneCanvas'
import { RightPanel } from '@/components/panels/RightPanel'
import { initScene } from '@/api/syncService'
import { useSceneStore } from '@/store/sceneStore'
import { useSyncStore } from '@/store/syncStore'

export function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    if (!id) {
      navigate('/files', { replace: true })
      return
    }
    let cancelled = false
    initScene(id).then((status) => {
      if (cancelled) return
      if (status === 'not_found') navigate('/files', { replace: true })
    })
    return () => {
      cancelled = true
      useSceneStore.getState().resetScene()
      useSyncStore.getState().setSceneId(null)
    }
  }, [id, navigate])

  return (
    <AppLayout>
      <SceneRibbon />
      <div className="flex flex-1 overflow-hidden">
        <SceneCanvas />
        <RightPanel />
      </div>
    </AppLayout>
  )
}
