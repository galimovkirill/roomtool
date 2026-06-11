import * as THREE from 'three'
import { SCENE_CONFIG } from '@/config/scene'

const { width, depth, height } = SCENE_CONFIG.room

export function Room() {
  return (
    <>
      {/* Пол */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#c8b89a" side={THREE.DoubleSide} />
      </mesh>

      {/* Задняя стена */}
      <mesh position={[0, height / 2, -depth / 2]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#8a8a8a" />
      </mesh>

      {/* Левая стена */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-width / 2, height / 2, 0]} receiveShadow>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color="#767676" />
      </mesh>
    </>
  )
}
