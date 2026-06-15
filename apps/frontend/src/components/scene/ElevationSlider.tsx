import { useRef } from 'react'
import { useShallow } from 'zustand/shallow'
import type { Vec3 } from '@/types'
import { useSceneStore, useEditorStore, useUIStore } from '@/store'
import { selectRoom } from '@/store/sceneStore'
import { isItemEffectivelyLocked } from '@/utils/locked'
import { computeGroupCenter, groupDragDelta } from '@/utils/groupTransform'
import { computeItemsBounds } from '@/utils/bounds'
import { useDragSession } from './useDragSession'

const TRACK_PX = 200

export function ElevationSlider() {
  const showGizmo = useUIStore((s) => s.showGizmo)

  const selectedIds = useEditorStore((s) => s.selectedItemIds)
  const { items, groups } = useSceneStore(
    useShallow((s) => ({
      items: s.items,
      groups: s.groups,
    }))
  )
  const roomHeight = useSceneStore(selectRoom).height

  const selectedItems = items.filter((i) => selectedIds.includes(i.id))

  const { startDrag, moveDrag: dragSelectionBy, endDrag, startItemsRef } = useDragSession()

  // Snapshot captured once at drag start — same pattern as TransformProxy/useMeshDrag.
  const startCenterRef = useRef<Vec3 | null>(null)
  const groupHeightRef = useRef<number>(0)
  const hasMoved = useRef(false)

  if (showGizmo || selectedItems.length === 0) return null

  const allLocked = selectedItems.every((item) => isItemEffectivelyLocked(item, groups))
  if (allLocked) return null

  const { min: selMin, max: selMax } = computeItemsBounds(selectedItems)
  const minY = selMin[1]
  const groupHeight = selMax[1] - minY
  const maxOffset = roomHeight - groupHeight
  if (maxOffset <= 0) return null

  const currentOffset = Math.max(0, Math.min(maxOffset, Math.round(minY)))

  function handlePointerDown() {
    const snapSelected = useSceneStore.getState().items.filter((i) => selectedIds.includes(i.id))
    startCenterRef.current = computeGroupCenter(snapSelected)
    const { min: snapMin, max: snapMax } = computeItemsBounds(snapSelected)
    groupHeightRef.current = snapMax[1] - snapMin[1]
    hasMoved.current = false
    startDrag(selectedIds)
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
