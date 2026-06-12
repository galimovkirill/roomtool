import { useCallback, useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { useSceneStore } from '@/store'
import { groupDragDelta } from '@/utils/groupTransform'
import type { SceneItem } from '@/types'

const DRAG_THRESHOLD_SQ = 25 // 5px squared
const UP = new THREE.Vector3(0, 1, 0)

type Vec3 = [number, number, number]

export interface MeshDragHandlers {
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void
  onDragClick: (e: ThreeEvent<MouseEvent>) => boolean
  isDraggingRef: MutableRefObject<boolean>
}

export function useMeshDrag(itemId: string): MeshDragHandlers {
  const { camera, gl } = useThree()

  const beginDrag = useSceneStore((s) => s.beginDrag)
  const dragSelectionBy = useSceneStore((s) => s.dragSelectionBy)
  const endDrag = useSceneStore((s) => s.endDrag)

  const isDraggingRef = useRef(false)
  const wasDraggedRef = useRef(false)
  const dragPlaneRef = useRef(new THREE.Plane())
  const startIntersectRef = useRef(new THREE.Vector3())
  const startItemsRef = useRef<SceneItem[]>([])
  const targetIdsRef = useRef<string[]>([])
  const lastDeltaRef = useRef<Vec3>([0, 0, 0])
  const pointerDownClientRef = useRef({ x: 0, y: 0 })
  const cleanupRef = useRef<(() => void) | null>(null)

  // Reused objects to avoid per-event heap allocations
  const _ray = useRef(new THREE.Raycaster())
  const _ndc = useRef(new THREE.Vector2())
  const _hit = useRef(new THREE.Vector3())

  useEffect(() => {
    return () => {
      cleanupRef.current?.()
      cleanupRef.current = null
    }
  }, [])

  const getPlaneIntersect = useCallback(
    (clientX: number, clientY: number): THREE.Vector3 | null => {
      const rect = gl.domElement.getBoundingClientRect()
      _ndc.current.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      )
      _ray.current.setFromCamera(_ndc.current, camera)
      return _ray.current.ray.intersectPlane(dragPlaneRef.current, _hit.current)
        ? _hit.current
        : null
    },
    [camera, gl]
  )

  const onPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      const state = useSceneStore.getState()
      if (!state.selectedItemIds.includes(itemId)) return

      e.stopPropagation()

      // Clean up any lingering listeners from a previous interrupted gesture
      cleanupRef.current?.()

      // Horizontal drag plane through the exact click point — no jump on drag start
      dragPlaneRef.current.set(UP, -e.point.y)
      startIntersectRef.current.copy(e.point)

      startItemsRef.current = state.items
      targetIdsRef.current = state.selectedItemIds
      lastDeltaRef.current = [0, 0, 0]
      pointerDownClientRef.current = { x: e.clientX, y: e.clientY }
      isDraggingRef.current = false
      wasDraggedRef.current = false

      // Disable orbit immediately so any pointer movement doesn't rotate the camera
      window.dispatchEvent(new CustomEvent('transform-start'))

      const onMove = (ev: PointerEvent) => {
        if (!isDraggingRef.current) {
          const dx = ev.clientX - pointerDownClientRef.current.x
          const dy = ev.clientY - pointerDownClientRef.current.y
          if (dx * dx + dy * dy < DRAG_THRESHOLD_SQ) return

          // If TransformProxy already owns a drag session (gizmo arrow was clicked),
          // back off and let the gizmo handle it.
          if (useSceneStore.getState().dragSession !== null) return

          isDraggingRef.current = true
          wasDraggedRef.current = true
          beginDrag(targetIdsRef.current)
          document.body.style.cursor = 'grabbing'
        }

        const current = getPlaneIntersect(ev.clientX, ev.clientY)
        if (!current) return

        const { x, y, z } = startIntersectRef.current
        const delta = groupDragDelta(
          [current.x, current.y, current.z],
          [x, y, z],
          targetIdsRef.current,
          startItemsRef.current
        )
        lastDeltaRef.current = delta
        dragSelectionBy(delta)
      }

      const onUp = () => {
        cleanupRef.current = null
        gl.domElement.removeEventListener('pointermove', onMove)
        gl.domElement.removeEventListener('pointerup', onUp)
        window.dispatchEvent(new CustomEvent('transform-end'))
        document.body.style.cursor = 'auto'

        if (!isDraggingRef.current) return
        isDraggingRef.current = false
        const [dx, , dz] = lastDeltaRef.current
        endDrag(dx !== 0 || dz !== 0)
      }

      cleanupRef.current = () => {
        gl.domElement.removeEventListener('pointermove', onMove)
        gl.domElement.removeEventListener('pointerup', onUp)
        window.dispatchEvent(new CustomEvent('transform-end'))
        if (isDraggingRef.current) {
          isDraggingRef.current = false
          endDrag(false)
        }
        document.body.style.cursor = 'auto'
      }

      gl.domElement.addEventListener('pointermove', onMove)
      gl.domElement.addEventListener('pointerup', onUp)
    },
    [itemId, beginDrag, dragSelectionBy, endDrag, getPlaneIntersect, gl]
  )

  const onDragClick = useCallback((e: ThreeEvent<MouseEvent>): boolean => {
    if (!wasDraggedRef.current) return false
    wasDraggedRef.current = false
    e.stopPropagation()
    return true
  }, [])

  return { onPointerDown, onDragClick, isDraggingRef }
}
