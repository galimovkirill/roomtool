import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { Edges, Html, useGLTF } from '@react-three/drei'
import type { SceneItem } from '@/types'
import { useSceneStore, useUIStore } from '@/store'
import { ElementPopover } from '@/components/ui/ElementPopover'
import { getCatalogItemById } from '@/catalog/items'

const DEFAULT_COLOR = '#cccccc'

function GltfMesh({ src, dimensions }: { src: string; dimensions: SceneItem['dimensions'] }) {
  const { scene } = useGLTF(src)

  const scaled = useMemo(() => {
    const c = scene.clone()
    const box = new THREE.Box3().setFromObject(c)
    const size = new THREE.Vector3()
    box.getSize(size)
    if (size.x > 0 && size.y > 0 && size.z > 0) {
      const scale = Math.min(
        dimensions.width / size.x,
        dimensions.height / size.y,
        dimensions.depth / size.z
      )
      c.scale.setScalar(scale)
      // group is at y=height/2 in world space; offset model so bottom is at world y=0
      const scaledBox = new THREE.Box3().setFromObject(c)
      c.position.y -= scaledBox.min.y + dimensions.height / 2
    }
    return c
  }, [scene, dimensions.width, dimensions.height, dimensions.depth])

  return <primitive object={scaled} />
}

interface Props {
  item: SceneItem
}

// Presentational only: renders the element from the store and reports clicks for
// selection. Movement is handled entirely by TransformProxy via the store, so the
// element position is never mutated imperatively here — there is no second source
// of truth to drift out of sync.
export function SceneElement({ item }: Props) {
  const [hovered, setHovered] = useState(false)
  const selectedItemIds = useSceneStore((s) => s.selectedItemIds)
  const selectItem = useSceneStore((s) => s.selectItem)
  const editItem = useSceneStore((s) => s.editItem)
  const sceneMode = useUIStore((s) => s.sceneMode)

  const isSelected = selectedItemIds.includes(item.id)

  const propColor = item.properties?.color as string | undefined
  const color = propColor?.startsWith('#') ? propColor : DEFAULT_COLOR
  const isGlass = item.properties?.material === 'Стекло'
  const catalogItem = getCatalogItemById(item.catalogId)

  useEffect(
    () => () => {
      document.body.style.cursor = 'auto'
    },
    []
  )

  return (
    <group position={item.position} rotation={[0, item.rotationY, 0]}>
      {catalogItem?.render?.type === 'gltf' ? (
        <group
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
          onDoubleClick={(e) => {
            e.stopPropagation()
            editItem(item.id)
          }}
        >
          <GltfMesh src={catalogItem.render.src} dimensions={item.dimensions} />
        </group>
      ) : (
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
          onDoubleClick={(e) => {
            e.stopPropagation()
            editItem(item.id)
          }}
        >
          <boxGeometry
            args={[item.dimensions.width, item.dimensions.height, item.dimensions.depth]}
          />
          <meshStandardMaterial
            color={color}
            opacity={isGlass ? (hovered ? 0.3 : 0.4) : hovered ? 0.85 : 1}
            transparent={isGlass || hovered}
          />
          <Edges lineWidth={2} color={isSelected ? '#2563eb' : '#000000'} />
        </mesh>
      )}
      {selectedItemIds.length === 1 && isSelected && <ElementPopover item={item} />}
      {sceneMode === '2d' && (
        // TODO: при ротации width/depth не меняются местами — Known Limitation (AABB без учёта поворота)
        <Html center position={[0, item.dimensions.height / 2 + 20, 0]}>
          <div className="text-xs bg-white/80 px-1 py-0.5 rounded border border-gray-400 whitespace-nowrap pointer-events-none">
            {item.dimensions.width} × {item.dimensions.depth} мм
          </div>
        </Html>
      )}
    </group>
  )
}
