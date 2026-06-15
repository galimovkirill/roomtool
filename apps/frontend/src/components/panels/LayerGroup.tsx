import { Eye, EyeOff, Lock, LockOpen } from 'lucide-react'
import { useSceneStore } from '@/store'
import type { LayerNode } from '@/utils/layerTree'
import { getAllItemIdsInGroup } from '@/utils/layerTree'
import type { SceneGroup, SceneItem } from '@/types'
import { LayerItem } from './LayerItem'

interface LayerGroupProps {
  group: SceneGroup
  children: LayerNode[]
  depth: number
  items: SceneItem[]
  groups: SceneGroup[]
  selectedItemIds: string[]
  renamingGroupId: string | null
  renameValue: string
  onSelectGroup: (ids: string[], anchor: string | null) => void
  onContextMenu: (id: string) => void
  onItemClick: (id: string, e: React.MouseEvent) => void
  onItemContextMenu: (id: string) => void
  onRenameChange: (v: string) => void
  onRenameCommit: () => void
  onRenameCancel: () => void
}

export function LayerGroup({
  group,
  children,
  depth,
  items,
  groups,
  selectedItemIds,
  renamingGroupId,
  renameValue,
  onSelectGroup,
  onContextMenu,
  onItemClick,
  onItemContextMenu,
  onRenameChange,
  onRenameCommit,
  onRenameCancel,
}: LayerGroupProps) {
  const toggleGroupCollapse = useSceneStore((s) => s.toggleGroupCollapse)
  const toggleGroupVisibility = useSceneStore((s) => s.toggleGroupVisibility)
  const toggleGroupLocked = useSceneStore((s) => s.toggleGroupLocked)

  const allIds = getAllItemIdsInGroup(group.id, items, groups)
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedItemIds.includes(id))
  const indent = depth * 16 + 12

  const sharedChildProps = {
    items,
    groups,
    selectedItemIds,
    renamingGroupId,
    renameValue,
    onSelectGroup,
    onItemClick,
    onItemContextMenu,
    onRenameChange,
    onRenameCommit,
    onRenameCancel,
  }

  return (
    <div>
      <div
        style={{ paddingLeft: `${indent}px` }}
        className={`flex items-center gap-2 pr-3 py-1.5 cursor-pointer hover:bg-gray-50 group/row ${
          allSelected ? 'bg-blue-50 text-blue-700' : ''
        }`}
        onClick={() => onSelectGroup(allIds, allIds[0] ?? null)}
        onContextMenu={() => onContextMenu(group.id)}
      >
        <button
          className="text-gray-400 w-3 text-xs flex-shrink-0"
          aria-label={group.collapsed ? 'Развернуть группу' : 'Свернуть группу'}
          onClick={(e) => {
            e.stopPropagation()
            toggleGroupCollapse(group.id)
          }}
        >
          {group.collapsed ? '▶' : '▼'}
        </button>
        <span className={`text-gray-500 flex-shrink-0 ${group.hidden ? 'opacity-40' : ''}`}>⊞</span>
        {renamingGroupId === group.id ? (
          <input
            className="text-sm flex-1 border border-blue-400 rounded px-1 outline-none"
            value={renameValue}
            onChange={(e) => onRenameChange(e.target.value)}
            onBlur={onRenameCommit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onRenameCommit()
              if (e.key === 'Escape') onRenameCancel()
              e.stopPropagation()
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <span
            className={`text-sm font-medium truncate flex-1 ${group.hidden ? 'opacity-40' : ''}`}
          >
            {group.name}
          </span>
        )}
        <button
          className={`flex-shrink-0 rounded p-0.5 transition-opacity ${
            group.hidden
              ? 'opacity-60 hover:opacity-100 text-gray-400'
              : 'opacity-0 group-hover/row:opacity-60 hover:!opacity-100 text-gray-400'
          }`}
          aria-label={group.hidden ? 'Показать группу' : 'Скрыть группу'}
          onClick={(e) => {
            e.stopPropagation()
            toggleGroupVisibility(group.id)
          }}
        >
          {group.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button
          className={`flex-shrink-0 rounded p-0.5 transition-opacity ${
            group.locked
              ? 'opacity-60 hover:opacity-100 text-gray-400'
              : 'opacity-0 group-hover/row:opacity-60 hover:!opacity-100 text-gray-400'
          }`}
          aria-label={group.locked ? 'Разблокировать группу' : 'Заблокировать группу'}
          onClick={(e) => {
            e.stopPropagation()
            toggleGroupLocked(group.id)
          }}
        >
          {group.locked ? <Lock size={14} /> : <LockOpen size={14} />}
        </button>
      </div>

      {!group.collapsed && (
        <div className={group.hidden ? 'opacity-50' : ''}>
          {children.map((child) =>
            child.type === 'item' ? (
              <LayerItem
                key={child.item.id}
                item={child.item}
                depth={depth + 1}
                groups={groups}
                isSelected={selectedItemIds.includes(child.item.id)}
                onItemClick={onItemClick}
                onContextMenu={onItemContextMenu}
              />
            ) : (
              <LayerGroup
                key={child.group.id}
                group={child.group}
                children={child.children}
                depth={depth + 1}
                onContextMenu={onContextMenu}
                {...sharedChildProps}
              />
            )
          )}
        </div>
      )}
    </div>
  )
}
