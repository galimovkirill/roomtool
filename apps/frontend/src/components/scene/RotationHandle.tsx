import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { useSceneStore } from '@/store'
import type { SceneItem } from '@/types'

const SNAP_RAD = 5 * (Math.PI / 180)
const HANDLE_PX = 8

function getHandleRadius(item: SceneItem): number {
  return Math.sqrt((item.dimensions.width / 2) ** 2 + (item.dimensions.depth / 2) ** 2) + 200
}

function toDeg(rad: number): number {
  const deg = (rad * 180) / Math.PI
  return Math.round(((deg % 360) + 360) % 360)
}

export function RotationHandle({ item }: { item: SceneItem }) {
  const { camera, gl } = useThree()
  const beginRotate = useSceneStore((s) => s.beginRotate)
  const rotateLive = useSceneStore((s) => s.rotateLive)
  const endRotate = useSceneStore((s) => s.endRotate)

  const [isDragging, setIsDragging] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [displayAngle, setDisplayAngle] = useState<number | null>(null)

  const meshRef = useRef<THREE.Mesh>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  const _raster = useRef(new THREE.Raycaster())
  const _ndc = useRef(new THREE.Vector2())
  const _hit = useRef(new THREE.Vector3())
  const _plane = useRef(new THREE.Plane())

  useFrame(() => {
    if (!meshRef.current) return
    const dist = camera.position.distanceTo(meshRef.current.position)
    const fov = (camera as THREE.PerspectiveCamera).fov
    const s = (dist * Math.tan((fov * Math.PI) / 360) * 2 * HANDLE_PX) / gl.domElement.clientHeight
    meshRef.current.scale.setScalar(s)
  })

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
        endRotate(false)
      }
    }
  }, [endRotate])

  const intersect = useCallback(
    (clientX: number, clientY: number): THREE.Vector3 | null => {
      const rect = gl.domElement.getBoundingClientRect()
      _ndc.current.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      )
      _raster.current.setFromCamera(_ndc.current, camera)
      return _raster.current.ray.intersectPlane(_plane.current, _hit.current)
        ? _hit.current.clone()
        : null
    },
    [camera, gl]
  )

  const handleRadius = getHandleRadius(item)
  const cx = item.position[0]
  const cy = item.position[1] + item.dimensions.height / 2
  const cz = item.position[2]

  // Handle sphere in the rotated local +Z direction of the element
  const handleX = cx + Math.sin(item.rotationY) * handleRadius
  const handleZ = cz + Math.cos(item.rotationY) * handleRadius
  const handleY = cy + 30

  const onPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      const state = useSceneStore.getState()
      if (
        state.dragSession !== null ||
        state.resizeSession !== null ||
        state.rotateSession !== null
      )
        return

      cleanupRef.current?.()

      const itemCx = item.position[0]
      const itemCz = item.position[2]

      _plane.current.setFromNormalAndCoplanarPoint(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, item.position[1], 0)
      )

      const initHit = intersect(e.clientX, e.clientY)
      if (!initHit) return

      const startAngle = Math.atan2(initHit.z - itemCz, initHit.x - itemCx)
      const startRotationY = item.rotationY
      let prevAngle = startAngle
      let totalDelta = 0

      setIsDragging(true)
      setDisplayAngle(toDeg(startRotationY))
      beginRotate()
      window.dispatchEvent(new CustomEvent('transform-start'))
      document.body.style.cursor = 'grabbing'

      const onMove = (ev: PointerEvent) => {
        const hit = intersect(ev.clientX, ev.clientY)
        if (!hit) return

        const currentAngle = Math.atan2(hit.z - itemCz, hit.x - itemCx)
        // Incremental step with wrapping to avoid jump at ±π discontinuity
        let step = prevAngle - currentAngle
        while (step > Math.PI) step -= 2 * Math.PI
        while (step < -Math.PI) step += 2 * Math.PI
        totalDelta += step
        prevAngle = currentAngle

        let newRotationY = startRotationY + totalDelta
        if (!ev.shiftKey) {
          newRotationY = Math.round(newRotationY / SNAP_RAD) * SNAP_RAD
        }

        rotateLive(item.id, newRotationY)
        setDisplayAngle(toDeg(newRotationY))
      }

      const onUp = () => {
        cleanup()
        endRotate(true)
      }

      const onKey = (ev: KeyboardEvent) => {
        if (ev.key === 'Escape') {
          cleanup()
          endRotate(false)
        }
      }

      const cleanup = () => {
        setIsDragging(false)
        setDisplayAngle(null)
        cleanupRef.current = null
        gl.domElement.removeEventListener('pointermove', onMove)
        gl.domElement.removeEventListener('pointerup', onUp)
        window.removeEventListener('keydown', onKey)
        window.dispatchEvent(new CustomEvent('transform-end'))
        document.body.style.cursor = 'auto'
      }

      cleanupRef.current = cleanup
      gl.domElement.addEventListener('pointermove', onMove)
      gl.domElement.addEventListener('pointerup', onUp)
      window.addEventListener('keydown', onKey)
    },
    [item, beginRotate, rotateLive, endRotate, intersect, gl]
  )

  return (
    <>
      {/* Horizontal ring indicator */}
      <mesh position={[cx, cy + 30, cz]} rotation={[Math.PI / 2, 0, 0]} renderOrder={5}>
        <torusGeometry args={[handleRadius, 18, 6, 64]} />
        <meshBasicMaterial
          color={isDragging ? '#f59e0b' : '#d97706'}
          transparent
          opacity={isDragging ? 0.6 : 0.25}
          depthTest={false}
        />
      </mesh>

      {/* Handle sphere */}
      <mesh
        ref={meshRef}
        position={[handleX, handleY, handleZ]}
        renderOrder={10}
        onPointerDown={onPointerDown}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'grab'
        }}
        onPointerOut={() => {
          setHovered(false)
          if (!isDragging) document.body.style.cursor = 'auto'
        }}
      >
        <sphereGeometry args={[1, 12, 8]} />
        <meshBasicMaterial
          color={isDragging ? '#ffffff' : hovered ? '#fbbf24' : '#f59e0b'}
          depthTest={false}
        />
      </mesh>

      {hovered && !isDragging && (
        <Html position={[handleX, handleY, handleZ]}>
          <div className="pointer-events-none select-none rounded bg-gray-900/90 px-2 py-0.5 text-xs text-white whitespace-nowrap -translate-x-1/2 -translate-y-full">
            Повернуть
          </div>
        </Html>
      )}

      {isDragging && displayAngle !== null && (
        <Html position={[cx, cy + 200, cz]}>
          <div className="pointer-events-none select-none rounded bg-black/75 px-2 py-0.5 text-xs text-white whitespace-nowrap -translate-x-1/2 -translate-y-[150%]">
            {displayAngle}°
          </div>
        </Html>
      )}
    </>
  )
}
