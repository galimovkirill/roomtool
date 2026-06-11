import { useEffect, useMemo, useRef, type ComponentRef } from 'react'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { SCENE_CONFIG } from '@/config/scene'

type OrbitControlsRef = ComponentRef<typeof OrbitControls>

export function SceneControls() {
  const orbitRef = useRef<OrbitControlsRef>(null)

  const { target } = SCENE_CONFIG.camera
  const orbitTarget = useMemo(
    () => new THREE.Vector3(target[0], target[1], target[2]),
    // SCENE_CONFIG — module-level const, target никогда не меняется
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useEffect(() => {
    const disable = () => {
      if (orbitRef.current) orbitRef.current.enabled = false
    }
    const enable = () => {
      if (orbitRef.current) orbitRef.current.enabled = true
    }
    window.addEventListener('transform-start', disable)
    window.addEventListener('transform-end', enable)
    return () => {
      window.removeEventListener('transform-start', disable)
      window.removeEventListener('transform-end', enable)
    }
  }, [])

  return (
    <OrbitControls
      ref={orbitRef}
      minDistance={SCENE_CONFIG.camera.minDistance}
      maxDistance={SCENE_CONFIG.camera.maxDistance}
      target={orbitTarget}
      zoomToCursor
    />
  )
}
