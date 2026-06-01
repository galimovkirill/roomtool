import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { TransformControls } from '@react-three/drei'
import { toast } from 'sonner'
import { useSceneStore } from '@/store'
import { useUIStore } from '@/store/uiStore'
import { clampGroupDelta, hasGroupCollision } from '@/utils/collision'

interface Props {
  groupId: string
}

export function GroupTransformProxy({ groupId }: Props) {
  const [pivotMesh, setPivotMesh] = useState<THREE.Mesh | null>(null)
  const initialCenterRef = useRef<[number, number, number]>([0, 0, 0])

  const group = useSceneStore((s) => s.groups.find((g) => g.id === groupId))
  const items = useSceneStore((s) => s.items)
  const moveGroup = useSceneStore((s) => s.moveGroup)
  const sceneMode = useUIStore((s) => s.sceneMode)

  const center = useMemo((): [number, number, number] => {
    if (!group) return [0, 0, 0]
    const groupItems = items.filter((i) => group.itemIds.includes(i.id))
    if (groupItems.length === 0) return [0, 0, 0]
    const xs = groupItems.flatMap((i) => [
      i.position[0] - i.dimensions.width / 2,
      i.position[0] + i.dimensions.width / 2,
    ])
    const ys = groupItems.flatMap((i) => [
      i.position[1] - i.dimensions.height / 2,
      i.position[1] + i.dimensions.height / 2,
    ])
    const zs = groupItems.flatMap((i) => [
      i.position[2] - i.dimensions.depth / 2,
      i.position[2] + i.dimensions.depth / 2,
    ])
    return [
      (Math.min(...xs) + Math.max(...xs)) / 2,
      (Math.min(...ys) + Math.max(...ys)) / 2,
      (Math.min(...zs) + Math.max(...zs)) / 2,
    ]
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
            initialCenterRef.current = [...center] as [number, number, number]
            window.dispatchEvent(new CustomEvent('transform-start'))
          }}
          onChange={() => {
            if (!pivotMesh) return
            const raw: [number, number, number] = [
              pivotMesh.position.x - initialCenterRef.current[0],
              pivotMesh.position.y - initialCenterRef.current[1],
              pivotMesh.position.z - initialCenterRef.current[2],
            ]
            // Clamp pivot live so it cannot visually pass through walls
            const currentItems = useSceneStore.getState().items
            const clamped = clampGroupDelta(group.itemIds, raw, currentItems)
            pivotMesh.position.set(
              initialCenterRef.current[0] + clamped[0],
              initialCenterRef.current[1] + clamped[1],
              initialCenterRef.current[2] + clamped[2]
            )
          }}
          onMouseUp={() => {
            window.dispatchEvent(new CustomEvent('transform-end'))
            if (!pivotMesh) return
            const raw: [number, number, number] = [
              pivotMesh.position.x - initialCenterRef.current[0],
              pivotMesh.position.y - initialCenterRef.current[1],
              pivotMesh.position.z - initialCenterRef.current[2],
            ]
            const currentItems = useSceneStore.getState().items
            const delta = clampGroupDelta(group.itemIds, raw, currentItems)
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
