import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BoxIcon, MoreHorizontalIcon, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/api/client'
import type { components } from '@/api/client'
import { formatRelativeDate } from '@/utils/formatDate'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { ShareDialog } from '@/components/share/ShareDialog'

type SceneSummary = components['schemas']['SceneSummary']
type Scene = components['schemas']['Scene']

interface Props {
  scene: SceneSummary
  onRename: (id: string, name: string) => void
  onDuplicate: (scene: Scene) => void
  onDelete: (id: string) => void
  onShareTokenChange?: (id: string, token: string | null) => void
}

export function SceneCard({ scene, onRename, onDuplicate, onDelete, onShareTokenChange }: Props) {
  const navigate = useNavigate()
  const [isRenaming, setIsRenaming] = useState(false)
  const [nameValue, setNameValue] = useState(scene.name)
  const [shareOpen, setShareOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isRenaming) inputRef.current?.focus()
  }, [isRenaming])

  function handleStartRename() {
    setNameValue(scene.name)
    setIsRenaming(true)
  }

  async function commitRename() {
    const trimmed = nameValue.trim()
    if (!trimmed || trimmed === scene.name) {
      setIsRenaming(false)
      return
    }
    onRename(scene.id, trimmed)
    setIsRenaming(false)
    const { error } = await apiClient.PATCH('/api/v1/scenes/{id}', {
      params: { path: { id: scene.id } },
      body: { name: trimmed },
    })
    if (error) {
      onRename(scene.id, scene.name)
      toast.error('Не удалось переименовать сцену')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitRename()
    if (e.key === 'Escape') {
      setNameValue(scene.name)
      setIsRenaming(false)
    }
  }

  async function handleDuplicate() {
    const { data, error } = await apiClient.POST('/api/v1/scenes/{id}/duplicate', {
      params: { path: { id: scene.id } },
    })
    if (error || !data) {
      toast.error('Не удалось дублировать сцену')
      return
    }
    onDuplicate(data)
  }

  async function handleDelete() {
    if (!window.confirm(`Удалить «${scene.name}»?`)) return
    onDelete(scene.id)
    const { error } = await apiClient.DELETE('/api/v1/scenes/{id}', {
      params: { path: { id: scene.id } },
    })
    if (error) {
      toast.error('Не удалось удалить сцену')
    } else {
      toast.success('Сцена удалена')
    }
  }

  return (
    <div
      className="group relative rounded-lg border bg-card hover:border-primary cursor-pointer transition-colors"
      onClick={() => navigate(`/editor/${scene.id}`)}
    >
      <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
        <BoxIcon className="w-12 h-12 text-muted-foreground/40" />
      </div>

      <div className="p-3">
        {isRenaming ? (
          <input
            ref={inputRef}
            className="w-full text-sm font-medium bg-transparent border-b border-primary outline-none"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <p
            className="text-sm font-medium truncate"
            onDoubleClick={(e) => {
              e.stopPropagation()
              handleStartRename()
            }}
          >
            {scene.name}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Изменено {formatRelativeDate(scene.updatedAt)}
        </p>
      </div>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        sceneId={scene.id}
        initialToken={scene.share_token ?? null}
        onTokenChange={(token) => onShareTokenChange?.(scene.id, token)}
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontalIcon className="w-4 h-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              handleStartRename()
            }}
          >
            Переименовать
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              handleDuplicate()
            }}
          >
            Дублировать
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              setShareOpen(true)
            }}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Поделиться
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation()
              handleDelete()
            }}
          >
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
