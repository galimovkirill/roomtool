import { useSceneStore } from '@/store'
import { useUIStore } from '@/store/uiStore'
import { CatalogPanel } from './CatalogPanel'
import { PropertiesPanel } from './PropertiesPanel'
import { LayersPanel } from './LayersPanel'

export function RightPanel() {
  const selectedItemId = useSceneStore((s) => s.selectedItemId)
  const activeTab = useUIStore((s) => s.activeRightPanelTab)
  const setActiveTab = useUIStore((s) => s.setActiveRightPanelTab)

  // PropertiesPanel opens only via selectItem() — 3D click or ElementPopover.
  // Layers-panel clicks use selectItems() which does not set selectedItemId.
  const showProperties = selectedItemId !== null

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-gray-200 flex-shrink-0">
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
      </div>

      <div className="flex-1 overflow-hidden">
        {showProperties ? (
          <PropertiesPanel itemId={selectedItemId} />
        ) : activeTab === 'catalog' ? (
          <CatalogPanel />
        ) : (
          <LayersPanel />
        )}
      </div>
    </div>
  )
}
