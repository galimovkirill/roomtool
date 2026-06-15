import { useState } from 'react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { toast } from 'sonner'
import { useSceneStore, useEditorStore } from '@/store'
import { buildLayerTree, flattenLayerTree, rangeSelection } from '@/utils/layerTree'
import { isItemEffectivelyLocked } from '@/utils/locked'
import { LayerItem } from './LayerItem'
import { LayerGroup } from './LayerGroup'

type CtxTarget = { kind: 'item'; id: string } | { kind: 'group'; id: string } | null

export function LayersPanel() {
  const items = useSceneStore((s) => s.items)
  const groups = useSceneStore((s) => s.groups)
  const createGroup = useSceneStore((s) => s.createGroup)
  const ungroupItems = useSceneStore((s) => s.ungroupItems)
  const removeItems = useSceneStore((s) => s.removeItems)
  const removeGroup = useSceneStore((s) => s.removeGroup)
  const renameGroup = useSceneStore((s) => s.renameGroup)

  const selectedItemIds = useEditorStore((s) => s.selectedItemIds)
  const selectItems = useEditorStore((s) => s.selectItems)
  const toggleItemSelection = useEditorStore((s) => s.toggleItemSelection)
  const editItem = useEditorStore((s) => s.editItem)

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

  const handleItemContextMenu = (id: string) => {
    const isSelected = selectedItemIds.includes(id)
    if (!isSelected) {
      selectItems([id])
      setAnchorId(id)
    }
    setCtxTarget({ kind: 'item', id })
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

  const sharedChildProps = {
    items,
    groups,
    selectedItemIds,
    renamingGroupId,
    renameValue,
    onItemClick: handleItemClick,
    onItemContextMenu: handleItemContextMenu,
    onRenameChange: setRenameValue,
    onRenameCommit: commitRename,
    onRenameCancel: () => setRenamingGroupId(null),
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger render={<div className="overflow-y-auto h-full py-1 select-none" />}>
        {tree.map((node) =>
          node.type === 'item' ? (
            <LayerItem
              key={node.item.id}
              item={node.item}
              depth={0}
              groups={groups}
              isSelected={selectedItemIds.includes(node.item.id)}
              onItemClick={handleItemClick}
              onContextMenu={handleItemContextMenu}
            />
          ) : (
            <LayerGroup
              key={node.group.id}
              group={node.group}
              children={node.children}
              depth={0}
              onSelectGroup={(ids, anchor) => {
                selectItems(ids)
                setAnchorId(anchor)
              }}
              onContextMenu={(id) => setCtxTarget({ kind: 'group', id })}
              {...sharedChildProps}
            />
          )
        )}
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
