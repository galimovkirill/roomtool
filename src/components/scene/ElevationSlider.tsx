import { useRef } from 'react'
import { useShallow } from 'zustand/shallow'
import { useSceneStore, useUIStore } from '@/store'
import { SCENE_CONFIG } from '@/config/scene'
import { isItemEffectivelyLocked } from '@/utils/locked'
import { computeGroupCenter, groupDragDelta } from '@/utils/groupTransform'
import type { SceneItem } from '@/types'

type Vec3 = [number, number, number]

const TRACK_PX = 200

export function ElevationSlider() {
  const showGizmo = useUIStore((s) => s.showGizmo)

  const { selectedIds, items, groups } = useSceneStore(
    useShallow((s) => ({
      selectedIds: s.selectedItemIds,
      items: s.items,
      groups: s.groups,
    }))
  )

  const selectedItems = items.filter((i) => selectedIds.includes(i.id))

  const beginDrag = useSceneStore((s) => s.beginDrag)
  const dragSelectionBy = useSceneStore((s) => s.dragSelectionBy)
  const endDrag = useSceneStore((s) => s.endDrag)

  // Snapshot captured once at drag start — same pattern as TransformProxy/useMeshDrag.
  const startCenterRef = useRef<Vec3 | null>(null)
  const startItemsRef = useRef<SceneItem[]>([])
  const groupHeightRef = useRef<number>(0)
  const hasMoved = useRef(false)

  if (showGizmo || selectedItems.length === 0) return null

  const allLocked = selectedItems.every((item) => isItemEffectivelyLocked(item, groups))
  if (allLocked) return null

  let minY = Infinity
  let maxY = -Infinity
  for (const item of selectedItems) {
    minY = Math.min(minY, item.position[1] - item.dimensions.height / 2)
    maxY = Math.max(maxY, item.position[1] + item.dimensions.height / 2)
  }
  const groupHeight = maxY - minY
  const roomHeight = SCENE_CONFIG.room.height
  const maxOffset = roomHeight - groupHeight
  if (maxOffset <= 0) return null

  const currentOffset = Math.max(0, Math.min(maxOffset, Math.round(minY)))

  function handlePointerDown() {
    const snap = useSceneStore.getState()
    const snapSelected = snap.items.filter((i) => selectedIds.includes(i.id))
    startCenterRef.current = computeGroupCenter(snapSelected)
    let snapMinY = Infinity
    let snapMaxY = -Infinity
    for (const it of snapSelected) {
      snapMinY = Math.min(snapMinY, it.position[1] - it.dimensions.height / 2)
      snapMaxY = Math.max(snapMaxY, it.position[1] + it.dimensions.height / 2)
    }
    groupHeightRef.current = snapMaxY - snapMinY
    startItemsRef.current = snap.items
    hasMoved.current = false
    beginDrag(selectedIds)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!startCenterRef.current) return
    const newOffset = Number(e.target.value)
    // Pivot (group center) shifts so that the group bottom lands at newOffset.
    const newCenterY = newOffset + groupHeightRef.current / 2
    const pivot: Vec3 = [startCenterRef.current[0], newCenterY, startCenterRef.current[2]]
    const delta = groupDragDelta(pivot, startCenterRef.current, selectedIds, startItemsRef.current)
    dragSelectionBy(delta)
    hasMoved.current = true
  }

  function handlePointerUp() {
    endDrag(hasMoved.current)
    startCenterRef.current = null
    startItemsRef.current = []
    groupHeightRef.current = 0
    hasMoved.current = false
  }

  return (
    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
      <div className="bg-black/40 backdrop-blur-sm rounded-lg px-2 py-3 flex flex-col items-center gap-2 select-none">
        <span className="text-[9px] text-white/40 leading-none">потолок</span>
        <span className="text-xs font-mono text-white tabular-nums leading-none">
          {currentOffset}
        </span>
        <div
          style={{ height: `${TRACK_PX}px`, width: '20px', position: 'relative', flexShrink: 0 }}
        >
          <input
            type="range"
            min={0}
            max={maxOffset}
            step={1}
            value={currentOffset}
            onChange={handleChange}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            style={{
              width: `${TRACK_PX}px`,
              height: '20px',
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%) rotate(-90deg)',
              cursor: 'ns-resize',
              accentColor: 'white',
            }}
          />
        </div>
        <span className="text-[9px] text-white/20 leading-none">мм</span>
        <span className="text-[9px] text-white/40 leading-none">пол</span>
      </div>
    </div>
  )
}
