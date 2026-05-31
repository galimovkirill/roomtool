import * as THREE from 'three'
import { Grid } from '@react-three/drei'
import { SCENE_CONFIG } from '@/config/scene'
import { useUIStore } from '@/store'

const { width, depth, height } = SCENE_CONFIG.room

export function Room() {
  const sceneMode = useUIStore((s) => s.sceneMode)

  return (
    <>
      {/* Пол */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#c8b89a" side={THREE.DoubleSide} />
      </mesh>

      {/* Задняя стена */}
      {sceneMode === '3d' && (
        <mesh position={[0, height / 2, -depth / 2]}>
          <planeGeometry args={[width, height]} />
          <meshStandardMaterial color="#8a8a8a" />
        </mesh>
      )}

      {/* Левая стена */}
      {sceneMode === '3d' && (
        <mesh rotation={[0, Math.PI / 2, 0]} position={[-width / 2, height / 2, 0]}>
          <planeGeometry args={[depth, height]} />
          <meshStandardMaterial color="#767676" />
        </mesh>
      )}

      {/* Grid для 2D-режима; +1 мм над полом чтобы избежать z-fighting */}
      {sceneMode === '2d' && (
        <Grid
          args={[width, depth]}
          cellColor="#aaaaaa"
          sectionColor="#666666"
          position={[0, 1, 0]}
          fadeDistance={SCENE_CONFIG.grid.fadeDistance}
        />
      )}
    </>
  )
}
