import { useRef, type ComponentRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { SCENE_CONFIG } from '@/config/scene'
import { Room } from './Room'
import { SceneControls } from './SceneControls'

const { initialPosition, fov, near, far } = SCENE_CONFIG.camera
const cameraPosition: [number, number, number] = [
  initialPosition[0],
  initialPosition[1],
  initialPosition[2],
]

export function SceneCanvas() {
  const orbitRef = useRef<ComponentRef<typeof SceneControls>>(null)

  return (
    <Canvas
      camera={{ position: cameraPosition, fov, near, far }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5000, 8000, 5000]} />
      <Room />
      <SceneControls ref={orbitRef} />
    </Canvas>
  )
}
