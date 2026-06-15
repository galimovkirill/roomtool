import { useSceneStore } from '@/store'
import { useKeyboard } from './useKeyboard'

export function KeyboardShortcuts() {
  useKeyboard({
    'ctrl+z': () => useSceneStore.getState().undo(),
    'ctrl+shift+z': () => useSceneStore.getState().redo(),
  })
  return null
}
