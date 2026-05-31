import { useSceneStore } from '@/store'
import { CatalogPanel } from './CatalogPanel'
import { PropertiesPanel } from './PropertiesPanel'

export function RightPanel() {
  const selectedItemId = useSceneStore((s) => s.selectedItemId)

  if (selectedItemId) {
    return <PropertiesPanel itemId={selectedItemId} />
  }

  return <CatalogPanel />
}
