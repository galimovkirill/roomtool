import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { SCENE_CONFIG } from '@/config/scene'
import { useSceneStore, useUIStore } from '@/store'
import { getAllItemIdsInGroup } from '@/utils/layerTree'
import type { SceneGroup, SceneItem } from '@/types'
import { Room } from './Room'
import { SceneControls } from './SceneControls'
import { SceneOverlay } from './SceneOverlay'
import { SceneRibbon } from './SceneRibbon'
import { SceneElement } from './SceneElement'
import { TransformProxy } from './TransformProxy'
import { ResizeHandles } from './ResizeHandles'
import { Scene2DView } from './Scene2DView'
import { ElevationSlider } from './ElevationSlider'
import { getCatalogItemById } from '@/catalog/items'
import { isItemEffectivelyLocked } from '@/utils/locked'

const { initialPosition, fov, near, far } = SCENE_CONFIG.camera

// Lumens for a ceiling point light; high value compensates ACESFilmic tone mapping applied by R3F Canvas
const CEILING_LIGHT_LUMENS = 4_000_000
// Objects within 10cm of the ceiling won't cast shadows — acceptable for MVP
const SHADOW_NEAR_DISTANCE = 100
// Max shadow distance: ceiling center → farthest floor corner + margin
const SHADOW_MAX_DISTANCE =
  Math.ceil(
    Math.sqrt(
      (SCENE_CONFIG.room.width / 2) ** 2 +
        SCENE_CONFIG.room.height ** 2 +
        (SCENE_CONFIG.room.depth / 2) ** 2
    )
  ) + 500
const perspPosition: [number, number, number] = [
  initialPosition[0],
  initialPosition[1],
  initialPosition[2],
]

function isItemVisibleInHierarchy(item: SceneItem, groups: SceneGroup[]): boolean {
  if (item.hidden) return false
  let groupId: string | null | undefined = item.groupId
  while (groupId) {
    const g = groups.find((g) => g.id === groupId)
    if (!g) break
    if (g.hidden) return false
    groupId = g.parentGroupId
  }
  return true
}

export function SceneCanvas() {
  const sceneMode = useUIStore((s) => s.sceneMode)
  const showGizmo = useUIStore((s) => s.showGizmo)
  const showCeilingLight = useUIStore((s) => s.showCeilingLight)
  const items = useSceneStore((s) => s.items)
  const groups = useSceneStore((s) => s.groups)
  const selectedItemIds = useSceneStore((s) => s.selectedItemIds)
  const selectItem = useSceneStore((s) => s.selectItem)

  const activeGroupId = useMemo(() => {
    if (selectedItemIds.length < 2) return null
    const selectedSet = new Set(selectedItemIds)
    const group = groups.find((g) => {
      const allIds = getAllItemIdsInGroup(g.id, items, groups)
      return allIds.length === selectedItemIds.length && allIds.every((id) => selectedSet.has(id))
    })
    return group?.id ?? null
  }, [selectedItemIds, groups, items])

  const allSelectedVisible = selectedItemIds.every((id) => {
    const item = items.find((i) => i.id === id)
    return item ? isItemVisibleInHierarchy(item, groups) : false
  })

  const allSelectedNotLocked = selectedItemIds.every((id) => {
    const item = items.find((i) => i.id === id)
    return item ? !isItemEffectivelyLocked(item, groups) : true
  })

  // Show the gizmo for a single element or a fully-selected group. An arbitrary
  // multi-selection that is not a saved group cannot be moved (no gizmo).
  const showTransformProxy =
    (selectedItemIds.length === 1 || activeGroupId !== null) &&
    allSelectedVisible &&
    allSelectedNotLocked

  // Show resize handles for a single visible non-GLTF unlocked selection only
  const singleSelectedItem =
    selectedItemIds.length === 1 && allSelectedVisible
      ? items.find((i) => i.id === selectedItemIds[0])
      : undefined
  const showResizeHandles =
    singleSelectedItem !== undefined &&
    !getCatalogItemById(singleSelectedItem.catalogId)?.render &&
    !isItemEffectivelyLocked(singleSelectedItem, groups)

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <SceneRibbon />
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <ElevationSlider />
        {sceneMode === '2d' ? (
          <Scene2DView />
        ) : (
          <>
            <Canvas
              shadows
              style={{ width: '100%', height: '100%' }}
              onPointerMissed={() => selectItem(null)}
            >
              <PerspectiveCamera
                makeDefault
                position={perspPosition}
                fov={fov}
                near={near}
                far={far}
              />
              <ambientLight intensity={showCeilingLight ? 0.8 : 1} />
              {showCeilingLight && (
                <pointLight
                  position={[0, SCENE_CONFIG.room.height, 0]}
                  intensity={CEILING_LIGHT_LUMENS}
                  castShadow
                  shadow-mapSize={[1024, 1024]}
                  shadow-camera-near={SHADOW_NEAR_DISTANCE}
                  shadow-camera-far={SHADOW_MAX_DISTANCE}
                />
              )}
              <Room />
              <SceneControls />
              {items
                .filter((item) => isItemVisibleInHierarchy(item, groups))
                .map((item) => (
                  <SceneElement
                    key={item.id}
                    item={item}
                    locked={isItemEffectivelyLocked(item, groups)}
                  />
                ))}
              {showTransformProxy && showGizmo && <TransformProxy targetIds={selectedItemIds} />}
              {showResizeHandles && singleSelectedItem && (
                <ResizeHandles item={singleSelectedItem} />
              )}
            </Canvas>
            <SceneOverlay />
          </>
        )}
      </div>
    </div>
  )
}
