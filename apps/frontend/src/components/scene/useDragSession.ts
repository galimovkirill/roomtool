import { useCallback, useRef } from 'react'
import { useSceneStore } from '@/store'
import type { SceneItem } from '@/types'

type Vec3 = [number, number, number]

export interface DragSession {
  startDrag(ids: string[]): void
  moveDrag(delta: Vec3): void
  endDrag(commit: boolean): void
  startItemsRef: React.MutableRefObject<SceneItem[]>
}

export function useDragSession(): DragSession {
  const beginDrag = useSceneStore((s) => s.beginDrag)
  const dragSelectionBy = useSceneStore((s) => s.dragSelectionBy)
  const endDragStore = useSceneStore((s) => s.endDrag)
  const startItemsRef = useRef<SceneItem[]>([])

  const startDrag = useCallback(
    (ids: string[]) => {
      startItemsRef.current = useSceneStore.getState().items
      beginDrag(ids)
    },
    [beginDrag]
  )

  return { startDrag, moveDrag: dragSelectionBy, endDrag: endDragStore, startItemsRef }
}
