import { Html } from '@react-three/drei'
import type { SceneItem } from '@/types'
import { useSceneStore } from '@/store'

interface Props {
  item: SceneItem
}

export function ElementPopover({ item }: Props) {
  const rotateItem = useSceneStore((s) => s.rotateItem)
  const removeItem = useSceneStore((s) => s.removeItem)

  return (
    <Html position={[0, item.dimensions.height / 2, 0]} center>
      <div className="flex gap-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1">
        <button
          type="button"
          aria-label="Повернуть влево"
          className="p-2 rounded hover:bg-gray-100 transition-colors text-sm"
          title="Повернуть влево"
          onClick={() => rotateItem(item.id, 'left')}
        >
          ↺
        </button>
        <button
          type="button"
          aria-label="Повернуть вправо"
          className="p-2 rounded hover:bg-gray-100 transition-colors text-sm"
          title="Повернуть вправо"
          onClick={() => rotateItem(item.id, 'right')}
        >
          ↻
        </button>
        <button
          type="button"
          aria-label="Удалить"
          className="p-2 rounded hover:bg-gray-100 transition-colors text-sm"
          title="Удалить"
          onClick={() => removeItem(item.id)}
        >
          🗑
        </button>
      </div>
    </Html>
  )
}
