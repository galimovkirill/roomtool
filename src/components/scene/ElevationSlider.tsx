import { useRef } from 'react'
import { useShallow } from 'zustand/shallow'
import { useSceneStore, useUIStore } from '@/store'
import { SCENE_CONFIG } from '@/config/scene'
import { isItemEffectivelyLocked } from '@/utils/locked'
import { groupDragDelta } from '@/utils/groupTransform'
import type { SceneItem } from '@/types'

type Vec3 = [number, number, number]

const TRACK_PX = 200

export function ElevationSlider() {
  const showGizmo = useUIStore((s) => s.showGizmo)

  const { item, groups } = useSceneStore(
    useShallow((s) => {
      const id = s.selectedItemIds.length === 1 ? s.selectedItemIds[0] : null
      return {
        item: id ? s.items.find((i) => i.id === id) : undefined,
        groups: s.groups,
      }
    })
  )

  const beginDrag = useSceneStore((s) => s.beginDrag)
  const dragSelectionBy = useSceneStore((s) => s.dragSelectionBy)
  const endDrag = useSceneStore((s) => s.endDrag)

  // Snapshot captured once at drag start — same pattern as TransformProxy/useMeshDrag.
  const startPositionRef = useRef<Vec3 | null>(null)
  const startItemsRef = useRef<SceneItem[]>([])
  const hasMoved = useRef(false)

  if (showGizmo || !item || isItemEffectivelyLocked(item, groups)) return null

  const itemHeight = item.dimensions.height
  const roomHeight = SCENE_CONFIG.room.height
  const maxOffset = roomHeight - itemHeight
  if (maxOffset <= 0) return null

  const currentOffset = Math.max(
    0,
    Math.min(maxOffset, Math.round(item.position[1] - itemHeight / 2))
  )

  const itemId = item.id
  const itemPos = item.position

  function handlePointerDown() {
    const snap = useSceneStore.getState()
    startPositionRef.current = [...itemPos] as Vec3
    startItemsRef.current = snap.items
    hasMoved.current = false
    beginDrag([itemId])
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!startPositionRef.current) return
    const [startX, startY, startZ] = startPositionRef.current
    const newOffset = Number(e.target.value)
    const newY = newOffset + itemHeight / 2
    // groupDragDelta applies clampGroupDelta (walls) + clampGroupDeltaAgainstItems (other elements),
    // exactly as TransformProxy does. X and Z stay fixed; only Y moves.
    const delta = groupDragDelta(
      [startX, newY, startZ],
      [startX, startY, startZ],
      [itemId],
      startItemsRef.current
    )
    dragSelectionBy(delta)
    hasMoved.current = true
  }

  function handlePointerUp() {
    endDrag(hasMoved.current)
    startPositionRef.current = null
    startItemsRef.current = []
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
