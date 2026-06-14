import { Separator } from '@/components/ui/separator'
import { useSceneStore } from '@/store'
import { useUIStore } from '@/store/uiStore'
import { CatalogPanel } from './CatalogPanel'
import { PropertiesPanel } from './PropertiesPanel'
import { LayersPanel } from './LayersPanel'

export function RightPanel() {
  const editingItemId = useSceneStore((s) => s.editingItemId)
  const activeTab = useUIStore((s) => s.activeRightPanelTab)
  const setActiveTab = useUIStore((s) => s.setActiveRightPanelTab)

  // PropertiesPanel opens only via editItem() — scene double-click or the
  // Layers context-menu "Редактировать". Plain selection (selectItem/selectItems)
  // shows the gizmo but does NOT replace the panel.
  const showProperties = editingItemId !== null

  return (
    <div className="w-80 flex flex-col border-l border-gray-200 bg-white overflow-y-auto h-full">
      <div className="flex flex-shrink-0">
        <button
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'layers'
              ? 'border-b-2 border-blue-600 text-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('layers')}
        >
          Слои
        </button>
        <button
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'catalog'
              ? 'border-b-2 border-blue-600 text-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('catalog')}
        >
          Каталог
        </button>
      </div>

      <Separator className="bg-gray-200" />

      <div className="flex-1 overflow-hidden">
        {showProperties ? (
          <PropertiesPanel itemId={editingItemId} />
        ) : activeTab === 'catalog' ? (
          <CatalogPanel />
        ) : (
          <LayersPanel />
        )}
      </div>
    </div>
  )
}
