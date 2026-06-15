import { useState } from 'react'
import { Copy, X } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/api/client'
import {
  Dialog,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
  DialogTitle,
  DialogClose,
  DialogHeader,
} from '@/components/ui/dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  sceneId: string
  initialToken: string | null
  onTokenChange: (token: string | null) => void
}

export function ShareDialog({ open, onOpenChange, sceneId, initialToken, onTokenChange }: Props) {
  const [token, setToken] = useState<string | null>(initialToken)
  const [prevInitialToken, setPrevInitialToken] = useState<string | null>(initialToken)
  const [loading, setLoading] = useState(false)

  if (prevInitialToken !== initialToken) {
    setPrevInitialToken(initialToken)
    setToken(initialToken)
  }

  async function handleEnable() {
    setLoading(true)
    const { data, error } = await apiClient.POST('/api/v1/scenes/{id}/share', {
      params: { path: { id: sceneId } },
    })
    setLoading(false)
    if (error || !data) {
      toast.error('Не удалось создать ссылку')
      return
    }
    const newToken = (data as { share_token: string }).share_token
    setToken(newToken)
    onTokenChange(newToken)
  }

  async function handleRevoke() {
    setLoading(true)
    const { error } = await apiClient.DELETE('/api/v1/scenes/{id}/share', {
      params: { path: { id: sceneId } },
    })
    setLoading(false)
    if (error) {
      toast.error('Не удалось отозвать ссылку')
      return
    }
    setToken(null)
    onTokenChange(null)
  }

  function handleCopy() {
    if (!token) return
    const url = `${window.location.origin}/share/${token}`
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Ссылка скопирована')
    })
  }

  const shareUrl = token ? `${window.location.origin}/share/${token}` : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Поделиться сценой</DialogTitle>
            <DialogClose onClick={() => onOpenChange(false)} aria-label="Закрыть">
              <X size={16} />
            </DialogClose>
          </DialogHeader>

          {token === null ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Создайте публичную ссылку, чтобы поделиться сценой без регистрации.
              </p>
              <button
                type="button"
                disabled={loading}
                onClick={handleEnable}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Создание...' : 'Создать ссылку'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2">
                <span className="flex-1 truncate text-sm text-muted-foreground">{shareUrl}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label="Скопировать ссылку"
                  className="shrink-0 rounded p-1 transition-colors hover:bg-accent"
                >
                  <Copy size={14} />
                </button>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={handleRevoke}
                className="w-full rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Отзыв...' : 'Отозвать ссылку'}
              </button>
            </div>
          )}
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  )
}
