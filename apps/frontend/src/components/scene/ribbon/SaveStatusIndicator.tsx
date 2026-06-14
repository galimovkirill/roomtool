import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { useSyncStore } from '@/store/syncStore'
import { syncNow } from '@/api/syncService'

export function SaveStatusIndicator() {
  const status = useSyncStore((s) => s.status)

  return (
    <div aria-live="polite" aria-atomic="true" className="flex items-center gap-1 text-xs">
      {status === 'syncing' && (
        <>
          <Loader2 size={13} className="animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Сохранение...</span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle size={13} className="text-destructive" />
          <span className="text-destructive">Ошибка сохранения</span>
          <button
            type="button"
            className="text-destructive underline underline-offset-2 hover:no-underline"
            onClick={() => void syncNow()}
          >
            Повторить
          </button>
        </>
      )}
      {status === 'idle' && (
        <>
          <CheckCircle size={13} className="text-muted-foreground" />
          <span className="text-muted-foreground">Сохранено</span>
        </>
      )}
    </div>
  )
}
