import { Eye, EyeOff, Lock, LockOpen } from 'lucide-react'
import { useSceneStore } from '@/store'
import type { SceneGroup, SceneItem } from '@/types'
import { isItemEffectivelyLocked } from '@/utils/locked'

interface LayerItemProps {
  item: SceneItem
  depth: number
  groups: SceneGroup[]
  isSelected: boolean
  onItemClick: (id: string, e: React.MouseEvent) => void
  onContextMenu: (id: string) => void
}

export function LayerItem({
  item,
  depth,
  groups,
  isSelected,
  onItemClick,
  onContextMenu,
}: LayerItemProps) {
  const toggleItemVisibility = useSceneStore((s) => s.toggleItemVisibility)
  const toggleItemLocked = useSceneStore((s) => s.toggleItemLocked)

  const indent = depth * 16 + 12
  const effectivelyLocked = isItemEffectivelyLocked(item, groups)
  const inheritedLock = !item.locked && effectivelyLocked

  return (
    <div
      style={{ paddingLeft: `${indent}px` }}
      className={`flex items-center gap-2 pr-3 py-1.5 cursor-pointer hover:bg-gray-50 group/row ${
        isSelected ? 'bg-blue-50 text-blue-700' : ''
      }`}
      onClick={(e) => onItemClick(item.id, e)}
      onContextMenu={() => onContextMenu(item.id)}
    >
      <span className="text-gray-400 flex-shrink-0 text-xs">▪</span>
      <span className={`text-sm truncate flex-1 ${item.hidden ? 'opacity-40' : ''}`}>
        {item.name}
      </span>
      <button
        className={`flex-shrink-0 rounded p-0.5 transition-opacity ${
          item.hidden
            ? 'opacity-60 hover:opacity-100 text-gray-400'
            : 'opacity-0 group-hover/row:opacity-60 hover:!opacity-100 text-gray-400'
        }`}
        aria-label={item.hidden ? 'Показать элемент' : 'Скрыть элемент'}
        onClick={(e) => {
          e.stopPropagation()
          toggleItemVisibility(item.id)
        }}
      >
        {item.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
      <button
        className={`flex-shrink-0 rounded p-0.5 transition-opacity text-gray-400 ${
          effectivelyLocked
            ? 'opacity-60 hover:opacity-100'
            : 'opacity-0 group-hover/row:opacity-60 hover:!opacity-100'
        } ${inheritedLock ? 'cursor-not-allowed' : ''}`}
        aria-label={
          item.locked
            ? 'Разблокировать элемент'
            : inheritedLock
              ? 'Заблокировано через группу'
              : 'Заблокировать элемент'
        }
        onClick={(e) => {
          e.stopPropagation()
          if (!inheritedLock) toggleItemLocked(item.id)
        }}
      >
        {effectivelyLocked ? <Lock size={14} /> : <LockOpen size={14} />}
      </button>
    </div>
  )
}
