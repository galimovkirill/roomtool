import { type RefObject, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Html, TransformControls } from '@react-three/drei'
import type { SceneItem } from '@/types'
import { useSceneStore, useUIStore } from '@/store'
import { ElementPopover } from '@/components/ui/ElementPopover'
import { totalOverlapVolume } from '@/utils/collision'
import { SCENE_CONFIG } from '@/config/scene'
import { toast } from 'sonner'

// floating-point tolerance for overlap volume comparison (mm³)
const OVERLAP_TOLERANCE = 1

const COLORS: Record<string, string> = {
  'wardrobe-body': '#d4a853',
  'wardrobe-narrow': '#d4a853',
  shelf: '#c49a3c',
  drawer: '#b8860b',
  rod: '#C0C0C0',
  'door-swing': '#87CEEB',
  'door-slide': '#4682B4',
}

function clampToRoom(
  pos: THREE.Vector3,
  dims: { width: number; height: number; depth: number }
): [number, number, number] {
  const { width: roomW, depth: roomD, height: roomH } = SCENE_CONFIG.room
  return [
    Math.min(roomW / 2 - dims.width / 2, Math.max(-roomW / 2 + dims.width / 2, pos.x)),
    Math.min(roomH - dims.height / 2, Math.max(dims.height / 2, pos.y)),
    Math.min(roomD / 2 - dims.depth / 2, Math.max(-roomD / 2 + dims.depth / 2, pos.z)),
  ]
}

interface Props {
  item: SceneItem
}

export function SceneElement({ item }: Props) {
  const [hovered, setHovered] = useState(false)
  const groupRef = useRef<THREE.Group>(null)
  const lastFramePos = useRef<[number, number, number]>(item.position)
  const isSelected = useSceneStore((s) => s.selectedItemId === item.id)
  const selectItem = useSceneStore((s) => s.selectItem)
  const updateItem = useSceneStore((s) => s.updateItem)
  const sceneMode = useUIStore((s) => s.sceneMode)

  const color = COLORS[item.catalogId] ?? '#cccccc'

  const edgesGeometry = useMemo(() => {
    const box = new THREE.BoxGeometry(
      item.dimensions.width,
      item.dimensions.height,
      item.dimensions.depth
    )
    const edges = new THREE.EdgesGeometry(box)
    box.dispose()
    return edges
  }, [item.dimensions.width, item.dimensions.height, item.dimensions.depth])

  useEffect(
    () => () => {
      document.body.style.cursor = 'auto'
    },
    []
  )

  useEffect(
    () => () => {
      edgesGeometry.dispose()
    },
    [edgesGeometry]
  )

  return (
    <>
      <group ref={groupRef} position={item.position} rotation={[0, item.rotationY, 0]}>
        <mesh
          castShadow
          receiveShadow
          onPointerOver={() => {
            setHovered(true)
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            setHovered(false)
            document.body.style.cursor = 'auto'
          }}
          onClick={(e) => {
            e.stopPropagation()
            selectItem(item.id)
          }}
        >
          <boxGeometry
            args={[item.dimensions.width, item.dimensions.height, item.dimensions.depth]}
          />
          <meshStandardMaterial color={color} opacity={hovered ? 0.85 : 1} transparent={hovered} />
        </mesh>
        {isSelected && (
          <lineSegments geometry={edgesGeometry}>
            <lineBasicMaterial color="#2563eb" />
          </lineSegments>
        )}
        {isSelected && <ElementPopover item={item} />}
        {sceneMode === '2d' && (
          // TODO: при ротации width/depth не меняются местами — Known Limitation (AABB без учёта поворота)
          <Html center position={[0, item.dimensions.height / 2 + 20, 0]}>
            <div className="text-xs bg-white/80 px-1 py-0.5 rounded border border-gray-400 whitespace-nowrap pointer-events-none">
              {item.dimensions.width} × {item.dimensions.depth} мм
            </div>
          </Html>
        )}
      </group>
      {isSelected && (
        <TransformControls
          object={groupRef as RefObject<THREE.Object3D>}
          mode="translate"
          showY={sceneMode === '3d'}
          onMouseDown={() => {
            if (groupRef.current)
              lastFramePos.current = groupRef.current.position.toArray() as [number, number, number]
            window.dispatchEvent(new CustomEvent('transform-start'))
          }}
          onMouseUp={() => {
            window.dispatchEvent(new CustomEvent('transform-end'))
            if (!groupRef.current) return
            const clamped = clampToRoom(groupRef.current.position, item.dimensions)
            groupRef.current.position.set(...clamped)
            const allItems = useSceneStore.getState().items
            const overlap = totalOverlapVolume({ ...item, position: clamped }, allItems)
            if (overlap > OVERLAP_TOLERANCE) {
              groupRef.current.position.set(...lastFramePos.current)
              toast.warning('Элементы не могут пересекаться')
              return
            }
            const [lx, ly, lz] = lastFramePos.current
            if (clamped[0] !== lx || clamped[1] !== ly || clamped[2] !== lz)
              updateItem(item.id, { position: clamped })
          }}
          onChange={() => {
            if (!groupRef.current) return
            const clamped = clampToRoom(groupRef.current.position, item.dimensions)
            const allItems = useSceneStore.getState().items
            // prevent moving into overlap: only advance position if total overlap doesn't increase
            const newOverlap = totalOverlapVolume({ ...item, position: clamped }, allItems)
            const curOverlap = totalOverlapVolume(
              { ...item, position: lastFramePos.current },
              allItems
            )
            if (newOverlap > curOverlap + OVERLAP_TOLERANCE) {
              groupRef.current.position.set(...lastFramePos.current)
            } else {
              lastFramePos.current = clamped
              groupRef.current.position.set(...clamped)
            }
          }}
        />
      )}
    </>
  )
}
