import { useState } from 'react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { toast } from 'sonner'
import { useSceneStore } from '@/store'
import {
  buildLayerTree,
  flattenLayerTree,
  getAllItemIdsInGroup,
  rangeSelection,
} from '@/utils/layerTree'
import type { LayerNode } from '@/utils/layerTree'
import type { SceneGroup, SceneItem } from '@/types'
import { isItemEffectivelyLocked } from '@/utils/locked'

type CtxTarget = { kind: 'item'; id: string } | { kind: 'group'; id: string } | null

function LockClosedIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="7" width="10" height="8" rx="1.5" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  )
}

function LockOpenIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="7" width="10" height="8" rx="1.5" />
      <path d="M5 7V5a3 3 0 0 1 6 0V2" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
      <circle cx="8" cy="8" r="2" />
      <line x1="2" y1="2" x2="14" y2="14" />
    </svg>
  )
}

export function LayersPanel() {
  const items = useSceneStore((s) => s.items)
  const groups = useSceneStore((s) => s.groups)
  const selectedItemIds = useSceneStore((s) => s.selectedItemIds)
  const selectItems = useSceneStore((s) => s.selectItems)
  const toggleItemSelection = useSceneStore((s) => s.toggleItemSelection)
  const editItem = useSceneStore((s) => s.editItem)
  const createGroup = useSceneStore((s) => s.createGroup)
  const ungroupItems = useSceneStore((s) => s.ungroupItems)
  const removeItems = useSceneStore((s) => s.removeItems)
  const removeGroup = useSceneStore((s) => s.removeGroup)
  const renameGroup = useSceneStore((s) => s.renameGroup)
  const toggleGroupCollapse = useSceneStore((s) => s.toggleGroupCollapse)
  const toggleItemVisibility = useSceneStore((s) => s.toggleItemVisibility)
  const toggleGroupVisibility = useSceneStore((s) => s.toggleGroupVisibility)
  const toggleItemLocked = useSceneStore((s) => s.toggleItemLocked)
  const toggleGroupLocked = useSceneStore((s) => s.toggleGroupLocked)

  const [ctxTarget, setCtxTarget] = useState<CtxTarget>(null)
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [anchorId, setAnchorId] = useState<string | null>(null)

  const tree = buildLayerTree(items, groups)
  const flatOrder = flattenLayerTree(tree)

  const handleItemClick = (id: string, e: React.MouseEvent) => {
    if (e.shiftKey && anchorId) {
      const range = rangeSelection(flatOrder, anchorId, id)
      if (range) {
        selectItems(range)
      } else {
        selectItems([id])
        setAnchorId(id)
      }
    } else if (e.ctrlKey || e.metaKey) {
      toggleItemSelection(id, true)
      setAnchorId(id)
    } else {
      selectItems([id])
      setAnchorId(id)
    }
  }

  const commitRename = () => {
    if (renamingGroupId) {
      const trimmed = renameValue.trim()
      if (!trimmed) {
        toast.warning('Имя группы не может быть пустым')
        setRenamingGroupId(null)
        return
      }
      renameGroup(renamingGroupId, trimmed)
    }
    setRenamingGroupId(null)
  }

  const startRename = (groupId: string, currentName: string) => {
    setRenamingGroupId(groupId)
    setRenameValue(currentName)
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-sm h-full">
        <span className="text-3xl mb-2">⧄</span>
        <span>Сцена пуста</span>
        <span className="text-xs mt-1 text-gray-300">Добавьте элементы из каталога</span>
      </div>
    )
  }

  const ctxItem = ctxTarget?.kind === 'item' ? items.find((i) => i.id === ctxTarget.id) : null
  const ctxGroup = ctxTarget?.kind === 'group' ? groups.find((g) => g.id === ctxTarget.id) : null

  const renderItem = (item: SceneItem, depth: number) => {
    const isSelected = selectedItemIds.includes(item.id)
    const indent = depth * 16 + 12
    return (
      <div
        key={item.id}
        style={{ paddingLeft: `${indent}px` }}
        className={`flex items-center gap-2 pr-3 py-1.5 cursor-pointer hover:bg-gray-50 group/row ${
          isSelected ? 'bg-blue-50 text-blue-700' : ''
        }`}
        onClick={(e) => handleItemClick(item.id, e)}
        onContextMenu={() => {
          if (!isSelected) {
            selectItems([item.id])
            setAnchorId(item.id)
          }
          setCtxTarget({ kind: 'item', id: item.id })
        }}
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
          {item.hidden ? <EyeOffIcon /> : <EyeIcon />}
        </button>
        {(() => {
          const effectivelyLocked = isItemEffectivelyLocked(item, groups)
          const inheritedLock = !item.locked && effectivelyLocked
          return (
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
              {effectivelyLocked ? <LockClosedIcon /> : <LockOpenIcon />}
            </button>
          )
        })()}
      </div>
    )
  }

  const renderGroup = (group: SceneGroup, children: LayerNode[], depth: number) => {
    const allIds = getAllItemIdsInGroup(group.id, items, groups)
    const allSelected = allIds.length > 0 && allIds.every((id) => selectedItemIds.includes(id))
    const indent = depth * 16 + 12

    return (
      <div key={group.id}>
        <div
          style={{ paddingLeft: `${indent}px` }}
          className={`flex items-center gap-2 pr-3 py-1.5 cursor-pointer hover:bg-gray-50 group/row ${
            allSelected ? 'bg-blue-50 text-blue-700' : ''
          }`}
          onClick={() => {
            selectItems(allIds)
            setAnchorId(allIds[0] ?? null)
          }}
          onContextMenu={() => {
            setCtxTarget({ kind: 'group', id: group.id })
          }}
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
          <span className={`text-gray-500 flex-shrink-0 ${group.hidden ? 'opacity-40' : ''}`}>
            ⊞
          </span>
          {renamingGroupId === group.id ? (
            <input
              className="text-sm flex-1 border border-blue-400 rounded px-1 outline-none"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') setRenamingGroupId(null)
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
            {group.hidden ? <EyeOffIcon /> : <EyeIcon />}
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
            {group.locked ? <LockClosedIcon /> : <LockOpenIcon />}
          </button>
        </div>

        {!group.collapsed && (
          <div className={group.hidden ? 'opacity-50' : ''}>
            {children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const renderNode = (node: LayerNode, depth: number): React.ReactNode => {
    if (node.type === 'item') return renderItem(node.item, depth)
    return renderGroup(node.group, node.children, depth)
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger render={<div className="overflow-y-auto h-full py-1 select-none" />}>
        {tree.map((node) => renderNode(node, 0))}
      </ContextMenuTrigger>

      <ContextMenuContent className="bg-white rounded-lg shadow-lg border border-gray-200 p-1 min-w-[180px] z-50">
        {ctxTarget?.kind === 'item' && (
          <>
            <ContextMenuItem
              className={`px-3 py-1.5 text-sm rounded outline-none ${
                ctxItem && isItemEffectivelyLocked(ctxItem, groups)
                  ? 'opacity-40 cursor-default'
                  : 'cursor-pointer hover:bg-gray-100'
              }`}
              onClick={() => {
                if (!ctxTarget) return
                if (ctxItem && isItemEffectivelyLocked(ctxItem, groups)) return
                editItem(ctxTarget.id)
              }}
            >
              Редактировать
            </ContextMenuItem>
            {selectedItemIds.length >= 2 && (
              <ContextMenuItem
                className="px-3 py-1.5 text-sm cursor-pointer rounded hover:bg-gray-100 outline-none"
                onClick={() => createGroup()}
              >
                Создать группу ({selectedItemIds.length})
              </ContextMenuItem>
            )}
            <ContextMenuItem
              className="px-3 py-1.5 text-sm cursor-pointer rounded hover:bg-red-50 text-red-600 outline-none"
              onClick={() => {
                const ids =
                  selectedItemIds.length >= 1 ? selectedItemIds : ctxTarget ? [ctxTarget.id] : []
                removeItems(ids)
              }}
            >
              {selectedItemIds.length > 1 ? `Удалить (${selectedItemIds.length})` : 'Удалить'}
            </ContextMenuItem>
            {ctxItem?.groupId && (
              <>
                <ContextMenuSeparator className="my-1 border-t border-gray-100" />
                <ContextMenuItem
                  className="px-3 py-1.5 text-sm cursor-pointer rounded hover:bg-gray-100 outline-none"
                  onClick={() => {
                    if (ctxItem.groupId) ungroupItems(ctxItem.groupId)
                  }}
                >
                  Разгруппировать
                </ContextMenuItem>
              </>
            )}
          </>
        )}

        {ctxTarget?.kind === 'group' && (
          <>
            <ContextMenuItem
              className="px-3 py-1.5 text-sm cursor-pointer rounded hover:bg-gray-100 outline-none"
              onClick={() => {
                if (ctxGroup) startRename(ctxGroup.id, ctxGroup.name)
              }}
            >
              Переименовать
            </ContextMenuItem>
            {selectedItemIds.length >= 2 &&
              (() => {
                const ctxGroupId = ctxTarget.id
                const allInThisGroup = selectedItemIds.every(
                  (id) => items.find((i) => i.id === id)?.groupId === ctxGroupId
                )
                return (
                  <ContextMenuItem
                    className="px-3 py-1.5 text-sm cursor-pointer rounded hover:bg-gray-100 outline-none"
                    onClick={() => createGroup()}
                  >
                    {allInThisGroup
                      ? `Создать подгруппу (${selectedItemIds.length})`
                      : `Создать группу (${selectedItemIds.length})`}
                  </ContextMenuItem>
                )
              })()}
            <ContextMenuItem
              className="px-3 py-1.5 text-sm cursor-pointer rounded hover:bg-gray-100 outline-none"
              onClick={() => ctxTarget && ungroupItems(ctxTarget.id)}
            >
              Разгруппировать
            </ContextMenuItem>
            <ContextMenuSeparator className="my-1 border-t border-gray-100" />
            <ContextMenuItem
              className="px-3 py-1.5 text-sm cursor-pointer rounded hover:bg-red-50 text-red-600 outline-none"
              onClick={() => ctxTarget && removeGroup(ctxTarget.id)}
            >
              Удалить группу и элементы
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
