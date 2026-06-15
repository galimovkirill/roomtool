import { useSceneStore, useEditorStore } from '@/store'
import { selectRoom } from '@/store/sceneStore'
import { getCatalogItemById } from '@/catalog/items'
import { getDefaultColorForMaterial } from '@/catalog/materials'
import type { PropertyDef } from '@/types'
import { PropertyField } from './PropertyField'

interface PropertiesPanelProps {
  itemId: string
}

function CloseIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M1.5 1.5l9 9M10.5 1.5l-9 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pt-3 pb-1.5">
      <span className="text-xs font-medium uppercase tracking-wider text-gray-400">{children}</span>
    </div>
  )
}

export function PropertiesPanel({ itemId }: PropertiesPanelProps) {
  const item = useSceneStore((s) => s.items.find((i) => i.id === itemId))
  const updateItem = useSceneStore((s) => s.updateItem)
  const room = useSceneStore(selectRoom)
  const closeEditing = useEditorStore((s) => s.closeEditing)

  const catalogItem = getCatalogItemById(item?.catalogId ?? '')

  if (!item || !catalogItem) return null

  const isGltf = catalogItem.render?.type === 'gltf'

  const handleChange = (def: PropertyDef, v: string | number) => {
    if (def.type === 'material') {
      updateItem(item.id, {
        properties: {
          ...item.properties,
          [def.key]: v,
          color: getDefaultColorForMaterial(v as string),
        },
      })
    } else {
      updateItem(item.id, { properties: { ...item.properties, [def.key]: v } })
    }
  }

  const header = (
    <div className="flex items-center justify-between px-3 h-10 bg-white border-b border-gray-200">
      <span className="text-sm font-medium text-gray-700 truncate">{item.name}</span>
      <button
        onClick={closeEditing}
        title="Закрыть панель"
        aria-label="Закрыть панель"
        className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors shrink-0 ml-2"
      >
        <CloseIcon />
      </button>
    </div>
  )

  if (isGltf) {
    const scale = typeof item.properties.scale === 'number' ? item.properties.scale : 100
    return (
      <div className="overflow-y-auto h-full">
        {header}
        <SectionLabel>Размер</SectionLabel>
        <div className="px-3 pb-3 flex flex-col gap-2.5">
          {catalogItem.properties.map((def) => (
            <PropertyField
              key={def.key}
              def={def}
              value={
                def.key === 'scale'
                  ? scale
                  : (item.properties[def.key] ?? (def.type === 'number' ? 0 : ''))
              }
              onChange={(v) => {
                if (def.key !== 'scale' || typeof v !== 'number') {
                  updateItem(item.id, { properties: { ...item.properties, [def.key]: v } })
                  return
                }
                const { width, height, depth } = catalogItem.defaultDimensions
                const factor = v / 100
                const newDims = {
                  width: width * factor,
                  height: height * factor,
                  depth: depth * factor,
                }
                updateItem(item.id, {
                  properties: { ...item.properties, scale: v },
                  dimensions: newDims,
                  position: [item.position[0], newDims.height / 2, item.position[2]],
                })
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto h-full">
      {header}

      <div className="border-b border-gray-100">
        <SectionLabel>Размеры</SectionLabel>
        <div className="px-3 pb-3 flex flex-col gap-2.5">
          <PropertyField
            def={{
              key: 'width',
              label: 'Ширина',
              type: 'number',
              unit: 'мм',
              min: 1,
              max: room.width,
            }}
            value={item.dimensions.width}
            onChange={(v) => {
              if (typeof v === 'number')
                updateItem(item.id, { dimensions: { ...item.dimensions, width: v } })
            }}
          />
          <PropertyField
            def={{
              key: 'height',
              label: 'Высота',
              type: 'number',
              unit: 'мм',
              min: 1,
              max: room.height,
            }}
            value={item.dimensions.height}
            onChange={(v) => {
              if (typeof v === 'number')
                updateItem(item.id, {
                  dimensions: { ...item.dimensions, height: v },
                  position: [item.position[0], v / 2, item.position[2]],
                })
            }}
          />
          <PropertyField
            def={{
              key: 'depth',
              label: 'Глубина',
              type: 'number',
              unit: 'мм',
              min: 1,
              max: room.depth,
            }}
            value={item.dimensions.depth}
            onChange={(v) => {
              if (typeof v === 'number')
                updateItem(item.id, { dimensions: { ...item.dimensions, depth: v } })
            }}
          />
        </div>
      </div>

      {catalogItem.properties.length > 0 && (
        <div>
          <SectionLabel>Свойства</SectionLabel>
          <div className="px-3 pb-3 flex flex-col gap-2.5">
            {catalogItem.properties.map((def) => (
              <PropertyField
                key={def.key}
                def={def}
                value={item.properties[def.key] ?? (def.type === 'number' ? 0 : '')}
                allProperties={item.properties}
                onChange={(v) => handleChange(def, v)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
