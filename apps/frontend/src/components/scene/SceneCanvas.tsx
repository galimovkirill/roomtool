import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, PerspectiveCamera } from '@react-three/drei'
import { SCENE_CONFIG } from '@/config/scene'
import { useSceneStore, useEditorStore, useUIStore } from '@/store'
import { selectRoom } from '@/store/sceneStore'
import { getAllItemIdsInGroup } from '@/utils/layerTree'
import type { SceneGroup, SceneItem } from '@/types'
import { Room } from './Room'
import { SceneControls } from './SceneControls'
import { SceneOverlay } from './SceneOverlay'
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
// Max shadow distance: ceiling → farthest floor corner for max room (50000×50000×10000mm) ≈ 36742 + margin
const SHADOW_MAX_DISTANCE = 37500
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
  const room = useSceneStore(selectRoom)
  const selectedItemIds = useEditorStore((s) => s.selectedItemIds)
  const selectItem = useEditorStore((s) => s.selectItem)

  const selectedItems = useMemo(() => {
    if (selectedItemIds.length === 0) return []
    const idSet = new Set(selectedItemIds)
    return items.filter((i) => idSet.has(i.id))
  }, [items, selectedItemIds])

  const activeGroupId = useMemo(() => {
    if (selectedItemIds.length < 2) return null
    const selectedSet = new Set(selectedItemIds)
    const group = groups.find((g) => {
      const allIds = getAllItemIdsInGroup(g.id, items, groups)
      return allIds.length === selectedItemIds.length && allIds.every((id) => selectedSet.has(id))
    })
    return group?.id ?? null
  }, [selectedItemIds, groups, items])

  const allSelectedVisible = selectedItems.every((item) => isItemVisibleInHierarchy(item, groups))
  const allSelectedNotLocked = selectedItems.every((item) => !isItemEffectivelyLocked(item, groups))

  // Show the gizmo for a single element or a fully-selected group. An arbitrary
  // multi-selection that is not a saved group cannot be moved (no gizmo).
  const showTransformProxy =
    (selectedItemIds.length === 1 || activeGroupId !== null) &&
    allSelectedVisible &&
    allSelectedNotLocked

  // Show resize handles for a single visible non-GLTF unlocked selection only
  const singleSelectedItem =
    selectedItemIds.length === 1 && allSelectedVisible ? selectedItems[0] : undefined
  const showResizeHandles =
    singleSelectedItem !== undefined &&
    !getCatalogItemById(singleSelectedItem.catalogId)?.render &&
    !isItemEffectivelyLocked(singleSelectedItem, groups)

  return (
    <div className="flex-1 relative overflow-hidden bg-gray-400">
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
            <Environment preset="apartment" background={false} environmentIntensity={0.45} />
            <ambientLight intensity={showCeilingLight ? 0.8 : 1} />
            {showCeilingLight && (
              <pointLight
                position={[0, room.height, 0]}
                intensity={CEILING_LIGHT_LUMENS}
                castShadow
                shadow-mapSize={[2048, 2048]}
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
            {showResizeHandles && singleSelectedItem && <ResizeHandles item={singleSelectedItem} />}
          </Canvas>
          <SceneOverlay />
        </>
      )}
    </div>
  )
}
