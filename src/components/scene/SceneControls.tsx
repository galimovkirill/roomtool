import { forwardRef, useMemo, type ComponentRef } from 'react'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { SCENE_CONFIG } from '@/config/scene'

type OrbitControlsRef = ComponentRef<typeof OrbitControls>

// ref используется SceneElement для disable/enable OrbitControls при drag TransformControls
export const SceneControls = forwardRef<OrbitControlsRef>(function SceneControls(_, ref) {
  const { target } = SCENE_CONFIG.camera
  const orbitTarget = useMemo(
    () => new THREE.Vector3(target[0], target[1], target[2]),
    // SCENE_CONFIG — module-level const, target никогда не меняется
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
  return (
    <OrbitControls
      ref={ref}
      minDistance={SCENE_CONFIG.camera.minDistance}
      maxDistance={SCENE_CONFIG.camera.maxDistance}
      target={orbitTarget}
    />
  )
})
