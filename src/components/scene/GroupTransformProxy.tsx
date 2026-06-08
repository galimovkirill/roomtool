import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { TransformControls } from '@react-three/drei'
import { toast } from 'sonner'
import { useSceneStore } from '@/store'
import { useUIStore } from '@/store/uiStore'
import { hasGroupCollision } from '@/utils/collision'
import { computeGroupCenter, groupDragDelta, pivotPositionOnChange } from '@/utils/groupTransform'

interface Props {
  groupId: string
}

export function GroupTransformProxy({ groupId }: Props) {
  const [pivotMesh, setPivotMesh] = useState<THREE.Mesh | null>(null)
  const initialCenterRef = useRef<[number, number, number]>([0, 0, 0])
  const draggingRef = useRef(false)

  const group = useSceneStore((s) => s.groups.find((g) => g.id === groupId))
  const items = useSceneStore((s) => s.items)
  const moveGroup = useSceneStore((s) => s.moveGroup)
  const sceneMode = useUIStore((s) => s.sceneMode)

  const center = useMemo((): [number, number, number] => {
    if (!group) return [0, 0, 0]
    return computeGroupCenter(items.filter((i) => group.itemIds.includes(i.id)))
  }, [items, group])

  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent('transform-end'))
    }
  }, [])

  useEffect(() => {
    if (pivotMesh) {
      pivotMesh.position.set(...center)
    }
  }, [pivotMesh, center])

  if (!group) return null

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
            initialCenterRef.current = [...center] as [number, number, number]
            window.dispatchEvent(new CustomEvent('transform-start'))
          }}
          onChange={() => {
            if (!pivotMesh) return
            // Clamp the pivot live so it cannot visually pass through walls.
            // pivotPositionOnChange returns null outside an active drag, ignoring
            // spurious "change" events fired on attach/render.
            const next = pivotPositionOnChange({
              dragging: draggingRef.current,
              pivotPosition: pivotMesh.position.toArray() as [number, number, number],
              initialCenter: initialCenterRef.current,
              groupItemIds: group.itemIds,
              items: useSceneStore.getState().items,
            })
            if (next) pivotMesh.position.set(...next)
          }}
          onMouseUp={() => {
            window.dispatchEvent(new CustomEvent('transform-end'))
            const wasDragging = draggingRef.current
            draggingRef.current = false
            if (!wasDragging || !pivotMesh) return
            const currentItems = useSceneStore.getState().items
            const delta = groupDragDelta(
              pivotMesh.position.toArray() as [number, number, number],
              initialCenterRef.current,
              group.itemIds,
              currentItems
            )
            if (hasGroupCollision(group.itemIds, delta, currentItems)) {
              pivotMesh.position.set(...initialCenterRef.current)
              toast.warning('Группа не может пересекаться с другими элементами')
              return
            }
            moveGroup(groupId, delta)
          }}
        />
      )}
    </>
  )
}
