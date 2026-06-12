import { useRef, useState, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import type { SceneItem } from '@/types'
import { useSceneStore } from '@/store'

interface HandleDef {
  id: string
  axis: 'x' | 'y' | 'z'
  sign: 1 | -1
  localPos: (w: number, h: number, d: number) => [number, number, number]
}

const HANDLE_DEFS: HandleDef[] = [
  { id: '+x', axis: 'x', sign: 1, localPos: (w) => [w / 2, 0, 0] },
  { id: '-x', axis: 'x', sign: -1, localPos: (w) => [-w / 2, 0, 0] },
  { id: '+y', axis: 'y', sign: 1, localPos: (_, h) => [0, h / 2, 0] },
  { id: '-y', axis: 'y', sign: -1, localPos: (_, h) => [0, -h / 2, 0] },
  { id: '+z', axis: 'z', sign: 1, localPos: (_, _h, d) => [0, 0, d / 2] },
  { id: '-z', axis: 'z', sign: -1, localPos: (_, _h, d) => [0, 0, -d / 2] },
]

const HANDLE_SIZE = 24
const HANDLE_GEO_ARGS: [number, number, number] = [HANDLE_SIZE, HANDLE_SIZE, HANDLE_SIZE]
// Dispose the temporary BoxGeometry immediately — only the EdgesGeometry is kept.
const _tmpBox = new THREE.BoxGeometry(...HANDLE_GEO_ARGS)
const edgesGeo = new THREE.EdgesGeometry(_tmpBox)
_tmpBox.dispose()

interface DragState {
  handleId: string
  axis: 'x' | 'y' | 'z'
  sign: 1 | -1
  startDims: { width: number; height: number; depth: number }
  startPos: [number, number, number]
  startIntersection: THREE.Vector3
  dragPlane: THREE.Plane
  axisWorld: THREE.Vector3
}

interface Props {
  item: SceneItem
}

function Handle({
  def,
  item,
  dragStateRef,
}: {
  def: HandleDef
  item: SceneItem
  dragStateRef: React.MutableRefObject<DragState | null>
}) {
  const [hovered, setHovered] = useState(false)
  const { camera, gl } = useThree()
  const beginResize = useSceneStore((s) => s.beginResize)

  const { width, height, depth } = item.dimensions
  const localPos = def.localPos(width, height, depth)

  const onPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()

      beginResize(item.id)

      const startDims = { ...item.dimensions }
      const startPos: [number, number, number] = [...item.position] as [number, number, number]

      const localAxis = new THREE.Vector3(
        def.axis === 'x' ? def.sign : 0,
        def.axis === 'y' ? def.sign : 0,
        def.axis === 'z' ? def.sign : 0
      )
      localAxis.applyEuler(new THREE.Euler(0, item.rotationY, 0))

      const handleWorldPos = new THREE.Vector3(...item.position).add(
        new THREE.Vector3(
          ...def.localPos(startDims.width, startDims.height, startDims.depth)
        ).applyEuler(new THREE.Euler(0, item.rotationY, 0))
      )

      const planNormal = camera.position.clone().sub(handleWorldPos).normalize()
      const dragPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(planNormal, handleWorldPos)

      const rect = gl.domElement.getBoundingClientRect()
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1
      const ray = new THREE.Raycaster()
      ray.setFromCamera(new THREE.Vector2(nx, ny), camera)
      const startIntersection = new THREE.Vector3()
      // Abort drag if ray is parallel to the plane (extremely rare edge case)
      if (!ray.ray.intersectPlane(dragPlane, startIntersection)) return

      dragStateRef.current = {
        handleId: def.id,
        axis: def.axis,
        sign: def.sign,
        startDims,
        startPos,
        startIntersection,
        dragPlane,
        axisWorld: localAxis,
      }

      window.dispatchEvent(new CustomEvent('transform-start'))
    },
    [item, def, camera, gl, beginResize, dragStateRef]
  )

  return (
    <mesh
      position={localPos}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'crosshair'
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
      onPointerDown={onPointerDown}
      onClick={(e) => e.stopPropagation()}
    >
      <boxGeometry args={HANDLE_GEO_ARGS} />
      <meshStandardMaterial color={hovered ? '#2563eb' : '#ffffff'} />
      <lineSegments geometry={edgesGeo}>
        <lineBasicMaterial color="#2563eb" />
      </lineSegments>
    </mesh>
  )
}

const MIN_DIM = 1

export function ResizeHandles({ item }: Props) {
  const dragStateRef = useRef<DragState | null>(null)
  const { camera, gl } = useThree()
  const resizeItemLive = useSceneStore((s) => s.resizeItemLive)
  const endResize = useSceneStore((s) => s.endResize)

  // Reset cursor on unmount (e.g. selection change while hovering a handle)
  useEffect(
    () => () => {
      document.body.style.cursor = 'auto'
    },
    []
  )

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragStateRef.current) return
      const { axis, sign, startDims, startPos, startIntersection, dragPlane, axisWorld } =
        dragStateRef.current

      const rect = gl.domElement.getBoundingClientRect()
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1
      const ray = new THREE.Raycaster()
      ray.setFromCamera(new THREE.Vector2(nx, ny), camera)
      const currentPoint = new THREE.Vector3()
      if (!ray.ray.intersectPlane(dragPlane, currentPoint)) return

      const rawDelta = currentPoint.clone().sub(startIntersection).dot(axisWorld)

      const dimKey = axis === 'x' ? 'width' : axis === 'y' ? 'height' : 'depth'
      let delta = rawDelta
      const newDim = Math.max(MIN_DIM, startDims[dimKey] + delta)
      delta = newDim - startDims[dimKey]

      // Floor constraint for bottom handle: element bottom stays at y >= 0
      if (axis === 'y' && sign === -1) {
        const maxDelta = startPos[1] - startDims.height / 2
        delta = Math.min(delta, maxDelta)
      }

      const finalDim = Math.max(MIN_DIM, startDims[dimKey] + delta)
      const newDims = { ...startDims, [dimKey]: finalDim }

      // Opposite face stays fixed: move center by half delta along world axis
      const posOffset = axisWorld.clone().multiplyScalar(delta / 2)
      const newPos: [number, number, number] = [
        startPos[0] + posOffset.x,
        startPos[1] + posOffset.y,
        startPos[2] + posOffset.z,
      ]
      // General floor guard
      newPos[1] = Math.max(newDims.height / 2, newPos[1])

      resizeItemLive(item.id, newDims, newPos)
    }

    const onUp = () => {
      if (!dragStateRef.current) return
      endResize()
      dragStateRef.current = null
      document.body.style.cursor = 'auto'
      window.dispatchEvent(new CustomEvent('transform-end'))
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      // Commit any in-progress resize if the component unmounts mid-drag
      // (e.g. selection programmatically cleared while dragging)
      if (dragStateRef.current) {
        endResize()
        dragStateRef.current = null
        window.dispatchEvent(new CustomEvent('transform-end'))
      }
    }
  }, [item.id, camera, gl, resizeItemLive, endResize])

  return (
    <>
      {HANDLE_DEFS.map((def) => (
        <Handle key={def.id} def={def} item={item} dragStateRef={dragStateRef} />
      ))}
    </>
  )
}
