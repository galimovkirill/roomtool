import * as THREE from 'three'
import { useSceneStore, selectRoom } from '@/store/sceneStore'

export function Room() {
  const { width, depth, height } = useSceneStore(selectRoom)

  return (
    <>
      {/* Пол */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#d4c4a8" roughness={0.65} side={THREE.DoubleSide} />
      </mesh>

      {/* Задняя стена */}
      <mesh position={[0, height / 2, -depth / 2]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#f0eee8" roughness={0.9} />
      </mesh>

      {/* Левая стена */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-width / 2, height / 2, 0]} receiveShadow>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color="#ebe9e3" roughness={0.9} />
      </mesh>
    </>
  )
}
