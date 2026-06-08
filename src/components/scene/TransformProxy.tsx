import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { TransformControls } from '@react-three/drei'
import { toast } from 'sonner'
import type { SceneItem } from '@/types'
import { useSceneStore } from '@/store'
import { useUIStore } from '@/store/uiStore'
import { hasGroupCollision } from '@/utils/collision'
import { computeGroupCenter, groupDragDelta } from '@/utils/groupTransform'

type Vec3 = [number, number, number]

interface Props {
  // Items the gizmo moves together. One id = single element, many = group.
  targetIds: string[]
}

// One movement mechanism for both a single element and a group: the gizmo is
// attached to an invisible pivot (never to the element meshes), so element
// positions are only ever read from the store and written via the drag session.
// This removes the dual source of truth (store vs Three.js object) that caused
// elements to snap back / lose individual moves.
export function TransformProxy({ targetIds }: Props) {
  const [pivotMesh, setPivotMesh] = useState<THREE.Mesh | null>(null)
  const initialCenterRef = useRef<Vec3>([0, 0, 0])
  // Read-only snapshot of item positions at drag start. Needed because the store
  // positions move live during the drag, but clamp/collision must be computed
  // against where the drag began (delta is relative to the start).
  const startItemsRef = useRef<SceneItem[]>([])
  const lastDeltaRef = useRef<Vec3>([0, 0, 0])
  const draggingRef = useRef(false)

  const items = useSceneStore((s) => s.items)
  const beginDrag = useSceneStore((s) => s.beginDrag)
  const dragSelectionBy = useSceneStore((s) => s.dragSelectionBy)
  const endDrag = useSceneStore((s) => s.endDrag)
  const sceneMode = useUIStore((s) => s.sceneMode)

  const targetItems = useMemo(
    () => items.filter((i) => targetIds.includes(i.id)),
    [items, targetIds]
  )
  const center = useMemo(() => computeGroupCenter(targetItems), [targetItems])

  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent('transform-end'))
    }
  }, [])

  // Keep the pivot at the selection center, but NOT during an active drag —
  // positions update live, so the recomputed center would fight the gizmo.
  // Order matters: onMouseUp clears draggingRef *before* the store commit
  // re-renders, so this effect runs once more with the final center afterwards.
  useEffect(() => {
    if (pivotMesh && !draggingRef.current) pivotMesh.position.set(...center)
  }, [pivotMesh, center])

  if (targetItems.length === 0) return null

  return (
    <>
      <mesh ref={setPivotMesh} position={center} visible={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial />
      </mesh>
      {pivotMesh && (
        <TransformControls
          object={pivotMesh}
          mode="translate"
          showY={sceneMode === '3d'}
          onMouseDown={() => {
            draggingRef.current = true
            initialCenterRef.current = [...center] as Vec3
            startItemsRef.current = useSceneStore.getState().items
            lastDeltaRef.current = [0, 0, 0]
            beginDrag(targetIds)
            window.dispatchEvent(new CustomEvent('transform-start'))
          }}
          onChange={() => {
            // Ignore "change" events fired outside an active drag (e.g. on attach).
            if (!draggingRef.current || !pivotMesh) return
            // Delta from where the drag began, clamped so no item passes a wall.
            const delta = groupDragDelta(
              pivotMesh.position.toArray() as Vec3,
              initialCenterRef.current,
              targetIds,
              startItemsRef.current
            )
            lastDeltaRef.current = delta
            // Reflect the clamp back onto the gizmo so it can't visually overrun.
            pivotMesh.position.set(
              initialCenterRef.current[0] + delta[0],
              initialCenterRef.current[1] + delta[1],
              initialCenterRef.current[2] + delta[2]
            )
            dragSelectionBy(delta)
          }}
          onMouseUp={() => {
            window.dispatchEvent(new CustomEvent('transform-end'))
            const wasDragging = draggingRef.current
            draggingRef.current = false
            if (!wasDragging) return
            const [dx, dy, dz] = lastDeltaRef.current
            // No movement: drop the gesture (no history, no toast).
            if (dx === 0 && dy === 0 && dz === 0) {
              endDrag(false)
              return
            }
            if (hasGroupCollision(targetIds, lastDeltaRef.current, startItemsRef.current)) {
              endDrag(false)
              pivotMesh.position.set(...initialCenterRef.current)
              toast.warning('Элементы не могут пересекаться')
              return
            }
            endDrag(true)
          }}
        />
      )}
    </>
  )
}
