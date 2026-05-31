import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera, OrthographicCamera } from '@react-three/drei'
import { SCENE_CONFIG } from '@/config/scene'
import { useUIStore } from '@/store'
import { Room } from './Room'
import { SceneControls } from './SceneControls'
import { SceneOverlay } from './SceneOverlay'

const { initialPosition, fov, near, far } = SCENE_CONFIG.camera
const perspPosition: [number, number, number] = [
  initialPosition[0],
  initialPosition[1],
  initialPosition[2],
]

export function SceneCanvas() {
  const sceneMode = useUIStore((s) => s.sceneMode)

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas style={{ width: '100%', height: '100%' }}>
        {sceneMode === '3d' ? (
          <PerspectiveCamera makeDefault position={perspPosition} fov={fov} near={near} far={far} />
        ) : (
          // up={[0,0,-1]}: стабильная ориентация при взгляде строго вниз, +Z → верх экрана
          <OrthographicCamera
            makeDefault
            position={[0, SCENE_CONFIG.room.height * 2, 0]}
            up={[0, 0, -1]}
            zoom={0.3}
            near={near}
            far={far}
          />
        )}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5000, 8000, 5000]} />
        <Room />
        <SceneControls enableRotate={sceneMode === '3d'} />
      </Canvas>
      <SceneOverlay />
    </div>
  )
}
