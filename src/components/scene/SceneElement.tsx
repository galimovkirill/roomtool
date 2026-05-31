import { type RefObject, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { TransformControls } from '@react-three/drei'
import type { SceneItem } from '@/types'
import { useSceneStore } from '@/store'
import { ElementPopover } from '@/components/ui/ElementPopover'

const COLORS: Record<string, string> = {
  'wardrobe-body': '#d4a853',
  'wardrobe-narrow': '#d4a853',
  shelf: '#c49a3c',
  drawer: '#b8860b',
  rod: '#C0C0C0',
  'door-swing': '#87CEEB',
  'door-slide': '#4682B4',
}

interface Props {
  item: SceneItem
}

export function SceneElement({ item }: Props) {
  const [hovered, setHovered] = useState(false)
  const groupRef = useRef<THREE.Group>(null)
  const isSelected = useSceneStore((s) => s.selectedItemId === item.id)
  const selectItem = useSceneStore((s) => s.selectItem)
  const updateItem = useSceneStore((s) => s.updateItem)

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
      </group>
      {isSelected && (
        <TransformControls
          object={groupRef as RefObject<THREE.Object3D>}
          mode="translate"
          onMouseDown={() => window.dispatchEvent(new CustomEvent('transform-start'))}
          onMouseUp={() => {
            window.dispatchEvent(new CustomEvent('transform-end'))
            if (!groupRef.current) return
            const pos = groupRef.current.position
            const clampedY = Math.max(item.dimensions.height / 2, pos.y)
            if (clampedY !== pos.y) groupRef.current.position.setY(clampedY)
            updateItem(item.id, { position: [pos.x, clampedY, pos.z] })
          }}
          onChange={() => {
            // Clamp Y on Three.js object during drag without touching the store
            if (!groupRef.current) return
            const pos = groupRef.current.position
            const clampedY = Math.max(item.dimensions.height / 2, pos.y)
            if (clampedY !== pos.y) groupRef.current.position.setY(clampedY)
          }}
        />
      )}
    </>
  )
}
