import { useSceneStore } from '@/store'
import { getCatalogItemById } from '@/catalog/items'
import { MATERIAL_COLORS, type MaterialType } from '@/catalog/materials'
import { SCENE_CONFIG } from '@/config/scene'
import type { PropertyDef } from '@/types'
import { PropertyField } from './PropertyField'

interface PropertiesPanelProps {
  itemId: string
}

export function PropertiesPanel({ itemId }: PropertiesPanelProps) {
  const item = useSceneStore((s) => s.items.find((i) => i.id === itemId))
  const updateItem = useSceneStore((s) => s.updateItem)
  const closeEditing = useSceneStore((s) => s.closeEditing)

  const catalogItem = getCatalogItemById(item?.catalogId ?? '')

  if (!item || !catalogItem) return null

  const isGltf = catalogItem.render?.type === 'gltf'

  const handleChange = (def: PropertyDef, v: string | number) => {
    if (def.type === 'material') {
      const firstColor = MATERIAL_COLORS[v as MaterialType]?.[0]?.value ?? ''
      updateItem(item.id, { properties: { ...item.properties, [def.key]: v, color: firstColor } })
    } else {
      updateItem(item.id, { properties: { ...item.properties, [def.key]: v } })
    }
  }

  const header = (
    <div className="flex items-center justify-between px-4 py-3 border-b">
      <span className="font-semibold">{item.name}</span>
      <button
        onClick={closeEditing}
        title="Закрыть панель"
        aria-label="Закрыть панель"
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        ✕
      </button>
    </div>
  )

  if (isGltf) {
    const scale = typeof item.properties.scale === 'number' ? item.properties.scale : 100
    return (
      <div className="overflow-y-auto h-full">
        {header}
        <div className="px-4 py-3 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Размер</p>
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

      <div className="px-4 py-3 border-b flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Размеры</p>
        <PropertyField
          def={{
            key: 'width',
            label: 'Ширина',
            type: 'number',
            unit: 'мм',
            min: 1,
            max: SCENE_CONFIG.room.width,
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
            max: SCENE_CONFIG.room.height,
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
            max: SCENE_CONFIG.room.depth,
          }}
          value={item.dimensions.depth}
          onChange={(v) => {
            if (typeof v === 'number')
              updateItem(item.id, { dimensions: { ...item.dimensions, depth: v } })
          }}
        />
      </div>

      {catalogItem.properties.length > 0 && (
        <div className="px-4 py-3 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Свойства</p>
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
      )}
    </div>
  )
}
