import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { SCENE_CONFIG } from '@/config/scene'
import { useSceneStore, useUIStore } from '@/store'
import { Room } from './Room'
import { SceneControls } from './SceneControls'
import { SceneOverlay } from './SceneOverlay'
import { SceneRibbon } from './SceneRibbon'
import { SceneElement } from './SceneElement'
import { TransformProxy } from './TransformProxy'
import { Scene2DView } from './Scene2DView'

const { initialPosition, fov, near, far } = SCENE_CONFIG.camera
const perspPosition: [number, number, number] = [
  initialPosition[0],
  initialPosition[1],
  initialPosition[2],
]

export function SceneCanvas() {
  const sceneMode = useUIStore((s) => s.sceneMode)
  const showGizmo = useUIStore((s) => s.showGizmo)
  const items = useSceneStore((s) => s.items)
  const groups = useSceneStore((s) => s.groups)
  const selectedItemIds = useSceneStore((s) => s.selectedItemIds)
  const selectItem = useSceneStore((s) => s.selectItem)

  const activeGroupId = useMemo(() => {
    if (selectedItemIds.length < 2) return null
    const group = groups.find(
      (g) =>
        g.itemIds.length === selectedItemIds.length &&
        selectedItemIds.every((id) => g.itemIds.includes(id))
    )
    return group?.id ?? null
  }, [selectedItemIds, groups])

  const allSelectedVisible = selectedItemIds.every((id) => {
    const item = items.find((i) => i.id === id)
    if (!item || item.hidden) return false
    return !groups.find((g) => g.id === item.groupId)?.hidden
  })

  // Show the gizmo for a single element or a fully-selected group. An arbitrary
  // multi-selection that is not a saved group cannot be moved (no gizmo).
  const showTransformProxy =
    (selectedItemIds.length === 1 || activeGroupId !== null) && allSelectedVisible

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <SceneRibbon />
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {sceneMode === '2d' ? (
          <Scene2DView />
        ) : (
          <>
            <Canvas
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
              <ambientLight intensity={0.6} />
              <directionalLight position={[5000, 8000, 5000]} />
              <Room />
              <SceneControls />
              {items
                .filter(
                  (item) => !item.hidden && !groups.find((g) => g.id === item.groupId)?.hidden
                )
                .map((item) => (
                  <SceneElement key={item.id} item={item} />
                ))}
              {showTransformProxy && showGizmo && <TransformProxy targetIds={selectedItemIds} />}
            </Canvas>
            <SceneOverlay />
          </>
        )}
      </div>
    </div>
  )
}
