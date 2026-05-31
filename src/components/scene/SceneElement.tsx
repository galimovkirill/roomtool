import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import type { SceneItem } from '@/types'
import { useSceneStore } from '@/store'

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
  const isSelected = useSceneStore((s) => s.selectedItemId === item.id)
  const selectItem = useSceneStore((s) => s.selectItem)

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
      edgesGeometry.dispose()
    },
    [edgesGeometry]
  )

  return (
    <group position={item.position} rotation={[0, item.rotationY, 0]}>
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
    </group>
  )
}
