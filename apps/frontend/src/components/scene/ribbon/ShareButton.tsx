import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, Share2 } from 'lucide-react'
import { apiClient } from '@/api/client'
import type { components } from '@/api/client'
import { RibbonButton } from './RibbonButton'
import { ShareDialog } from '@/components/share/ShareDialog'

type Scene = components['schemas']['Scene']

export function ShareButton() {
  const { id: sceneId } = useParams<{ id: string }>()
  const [open, setOpen] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [fetching, setFetching] = useState(false)

  async function handleOpen() {
    if (!sceneId) return
    setFetching(true)
    const { data } = await apiClient.GET('/api/v1/scenes/{id}', {
      params: { path: { id: sceneId } },
    })
    if (data) {
      setToken((data as Scene).share_token ?? null)
    }
    setFetching(false)
    setOpen(true)
  }

  if (!sceneId) return null

  return (
    <>
      <RibbonButton
        tooltip="Поделиться"
        aria-label="Поделиться сценой"
        onClick={handleOpen}
        disabled={fetching}
      >
        {fetching ? <Loader2 size={15} className="animate-spin" /> : <Share2 size={15} />}
      </RibbonButton>
      <ShareDialog
        open={open}
        onOpenChange={setOpen}
        sceneId={sceneId}
        initialToken={token}
        onTokenChange={setToken}
      />
    </>
  )
}
