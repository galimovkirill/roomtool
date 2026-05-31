import { useSceneStore } from '@/store'
import { CatalogPanel } from './CatalogPanel'

export function RightPanel() {
  const selectedItemId = useSceneStore((s) => s.selectedItemId)

  if (selectedItemId) {
    return <div className="p-4">Свойства (TASK-015)</div>
  }

  return <CatalogPanel />
}
