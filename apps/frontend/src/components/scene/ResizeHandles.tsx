import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { useSceneStore } from '@/store'
import { SCENE_CONFIG } from '@/config/scene'
import type { SceneItem, Vec3 } from '@/types'

const MIN_SIZE = 10
const MAX_SIZE = 10000
const HANDLE_PX = 8

type HandleAxis = '+x' | '-x' | '+y' | '-y' | '+z' | '-z'

const HANDLE_COLOR: Record<HandleAxis, string> = {
  '+x': '#ef4444',
  '-x': '#ef4444',
  '+y': '#22c55e',
  '-y': '#22c55e',
  '+z': '#3b82f6',
  '-z': '#3b82f6',
}

const HANDLE_TOOLTIP: Record<HandleAxis, string> = {
  '+x': 'Изменить ширину',
  '-x': 'Изменить ширину',
  '+y': 'Изменить высоту',
  '-y': 'Изменить высоту',
  '+z': 'Изменить глубину',
  '-z': 'Изменить глубину',
}

function getLocalAxes(rotY: number) {
  const c = Math.cos(rotY)
  const s = Math.sin(rotY)
  return {
    x: new THREE.Vector3(c, 0, -s),
    y: new THREE.Vector3(0, 1, 0),
    z: new THREE.Vector3(s, 0, c),
  }
}

function computeHandlePos(item: SceneItem, axis: HandleAxis): THREE.Vector3 {
  const { x, y, z } = getLocalAxes(item.rotationY)
  const c = new THREE.Vector3(...item.position)
  const { width: w, height: h, depth: d } = item.dimensions
  switch (axis) {
    case '+x':
      return c.addScaledVector(x, w / 2)
    case '-x':
      return c.addScaledVector(x, -w / 2)
    case '+y':
      return c.addScaledVector(y, h / 2)
    case '-y':
      return c.addScaledVector(y, -h / 2)
    case '+z':
      return c.addScaledVector(z, d / 2)
    case '-z':
      return c.addScaledVector(z, -d / 2)
  }
}

function getAxisInfo(axis: HandleAxis, rotY: number): { lAxis: THREE.Vector3; sign: number } {
  const { x, y, z } = getLocalAxes(rotY)
  switch (axis) {
    case '+x':
      return { lAxis: x, sign: 1 }
    case '-x':
      return { lAxis: x, sign: -1 }
    case '+y':
      return { lAxis: y, sign: 1 }
    case '-y':
      return { lAxis: y, sign: -1 }
    case '+z':
      return { lAxis: z, sign: 1 }
    case '-z':
      return { lAxis: z, sign: -1 }
  }
}

function getDimKey(axis: HandleAxis): keyof SceneItem['dimensions'] {
  if (axis === '+x' || axis === '-x') return 'width'
  if (axis === '+y' || axis === '-y') return 'height'
  return 'depth'
}

// ─── Single handle mesh ───────────────────────────────────────────────────────

function Handle({
  item,
  axis,
  isResizing,
  onPointerDown,
}: {
  item: SceneItem
  axis: HandleAxis
  isResizing: boolean
  onPointerDown: (axis: HandleAxis, pos: THREE.Vector3) => void
}) {
  const { camera, gl } = useThree()
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const pos = computeHandlePos(item, axis)

  useFrame(() => {
    if (!meshRef.current) return
    const dist = camera.position.distanceTo(meshRef.current.position)
    const fov = (camera as THREE.PerspectiveCamera).fov
    const s = (dist * Math.tan((fov * Math.PI) / 360) * 2 * HANDLE_PX) / gl.domElement.clientHeight
    meshRef.current.scale.setScalar(s)
  })

  return (
    <>
      <mesh
        ref={meshRef}
        position={[pos.x, pos.y, pos.z]}
        renderOrder={10}
        onPointerDown={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          onPointerDown(axis, pos.clone())
        }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'crosshair'
        }}
        onPointerOut={() => {
          setHovered(false)
          if (!isResizing) document.body.style.cursor = 'auto'
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={hovered ? '#ffffff' : HANDLE_COLOR[axis]} />
      </mesh>
      {hovered && !isResizing && (
        <Html position={[pos.x, pos.y, pos.z]}>
          <div className="pointer-events-none select-none rounded bg-gray-900/90 px-2 py-0.5 text-xs text-white whitespace-nowrap -translate-x-1/2 -translate-y-full">
            {HANDLE_TOOLTIP[axis]}
          </div>
        </Html>
      )}
    </>
  )
}

// ─── ResizeHandles ────────────────────────────────────────────────────────────

const ALL_AXES: HandleAxis[] = ['+x', '-x', '+y', '-y', '+z', '-z']

export function ResizeHandles({ item }: { item: SceneItem }) {
  const { camera, gl } = useThree()
  const beginResize = useSceneStore((s) => s.beginResize)
  const resizeLive = useSceneStore((s) => s.resizeLive)
  const endResize = useSceneStore((s) => s.endResize)

  const [isResizing, setIsResizing] = useState(false)
  const anchorRef = useRef(new THREE.Vector3())
  const lAxisRef = useRef(new THREE.Vector3(1, 0, 0))
  const signRef = useRef(1)
  const activeAxisRef = useRef<HandleAxis>('+x')
  const startDimsRef = useRef({ width: 0, height: 0, depth: 0 })
  const dragPlaneRef = useRef(new THREE.Plane())
  const cleanupRef = useRef<(() => void) | null>(null)
  const [label, setLabel] = useState<{ pos: Vec3; dim: number } | null>(null)

  const _raster = useRef(new THREE.Raycaster())
  const _ndc = useRef(new THREE.Vector2())
  const _hit = useRef(new THREE.Vector3())

  // On unmount during an active resize: clean up listeners and roll back store session.
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
        endResize(false)
      }
    }
  }, [endResize])

  const intersect = useCallback(
    (clientX: number, clientY: number): THREE.Vector3 | null => {
      const rect = gl.domElement.getBoundingClientRect()
      _ndc.current.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      )
      _raster.current.setFromCamera(_ndc.current, camera)
      return _raster.current.ray.intersectPlane(dragPlaneRef.current, _hit.current)
        ? _hit.current.clone()
        : null
    },
    [camera, gl]
  )

  const onHandleDown = useCallback(
    (axis: HandleAxis, handlePos: THREE.Vector3) => {
      if (useSceneStore.getState().dragSession !== null) return

      cleanupRef.current?.()

      const { lAxis, sign } = getAxisInfo(axis, item.rotationY)
      const halfDim = item.dimensions[getDimKey(axis)] / 2
      const center = new THREE.Vector3(...item.position)

      // anchor = opposite face center (stays fixed during resize)
      anchorRef.current = center.clone().addScaledVector(lAxis, -sign * halfDim)
      lAxisRef.current = lAxis.clone()
      signRef.current = sign
      activeAxisRef.current = axis
      startDimsRef.current = { ...item.dimensions }

      const normal = camera.position.clone().sub(handlePos).normalize()
      dragPlaneRef.current.setFromNormalAndCoplanarPoint(normal, handlePos)

      const itemId = item.id
      setIsResizing(true)
      beginResize()
      window.dispatchEvent(new CustomEvent('transform-start'))
      document.body.style.cursor = 'crosshair'

      const onMove = (ev: PointerEvent) => {
        const hit = intersect(ev.clientX, ev.clientY)
        if (!hit) return

        let newDim = signRef.current * hit.clone().sub(anchorRef.current).dot(lAxisRef.current)

        const ax = activeAxisRef.current
        if (ax === '-y') newDim = Math.min(newDim, anchorRef.current.y)
        else if (ax === '+y')
          newDim = Math.min(newDim, SCENE_CONFIG.room.height - anchorRef.current.y)

        newDim = Math.max(MIN_SIZE, Math.min(MAX_SIZE, newDim))

        const newDims = { ...startDimsRef.current, [getDimKey(ax)]: newDim }
        const newCenter = anchorRef.current
          .clone()
          .addScaledVector(lAxisRef.current, (signRef.current * newDim) / 2)

        resizeLive(itemId, newDims, [newCenter.x, newCenter.y, newCenter.z])

        const facePos = anchorRef.current
          .clone()
          .addScaledVector(lAxisRef.current, signRef.current * newDim)
        setLabel({ pos: [facePos.x, facePos.y, facePos.z], dim: Math.round(newDim) })
      }

      const onUp = () => {
        cleanup()
        endResize(true)
      }

      const onKey = (ev: KeyboardEvent) => {
        if (ev.key === 'Escape') {
          cleanup()
          endResize(false)
        }
      }

      const cleanup = () => {
        setIsResizing(false)
        cleanupRef.current = null
        gl.domElement.removeEventListener('pointermove', onMove)
        gl.domElement.removeEventListener('pointerup', onUp)
        window.removeEventListener('keydown', onKey)
        window.dispatchEvent(new CustomEvent('transform-end'))
        document.body.style.cursor = 'auto'
        setLabel(null)
      }

      cleanupRef.current = cleanup
      gl.domElement.addEventListener('pointermove', onMove)
      gl.domElement.addEventListener('pointerup', onUp)
      window.addEventListener('keydown', onKey)
    },
    [item, camera, gl, beginResize, resizeLive, endResize, intersect]
  )

  return (
    <>
      {ALL_AXES.map((axis) => (
        <Handle
          key={axis}
          item={item}
          axis={axis}
          isResizing={isResizing}
          onPointerDown={onHandleDown}
        />
      ))}
      {label && (
        <Html position={label.pos}>
          <div className="pointer-events-none select-none rounded bg-black/75 px-2 py-0.5 text-xs text-white whitespace-nowrap -translate-x-1/2 -translate-y-[150%]">
            {label.dim} мм
          </div>
        </Html>
      )}
    </>
  )
}
