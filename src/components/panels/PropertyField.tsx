import * as Label from '@radix-ui/react-label'
import * as Select from '@radix-ui/react-select'
import type { PropertyDef } from '@/types'
import { MATERIAL_COLORS, MATERIAL_OPTIONS, type MaterialType } from '@/catalog/materials'

interface PropertyFieldProps {
  def: PropertyDef
  value: number | string
  onChange: (v: number | string) => void
  allProperties?: Record<string, string | number>
}

const inputClass =
  'border border-gray-200 rounded px-2 py-1.5 w-full text-sm text-gray-700 ' +
  'focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100 ' +
  'hover:border-gray-300 transition-colors'

const labelClass = 'text-xs text-gray-400'

export function PropertyField({ def, value, onChange, allProperties }: PropertyFieldProps) {
  const label = def.unit ? `${def.label}, ${def.unit}` : def.label
  const fieldId = `field-${def.key}`

  if (def.type === 'number') {
    return (
      <div className="flex flex-col gap-1">
        <Label.Root htmlFor={fieldId} className={labelClass}>
          {label}
        </Label.Root>
        <input
          id={fieldId}
          type="number"
          min={def.min}
          max={def.max}
          value={value as number}
          onChange={(e) => {
            if (e.target.value !== '' && !isNaN(Number(e.target.value))) {
              const n = Number(e.target.value)
              const min = def.min ?? -Infinity
              const max = def.max ?? Infinity
              onChange(Math.min(max, Math.max(min, n)))
            }
          }}
          className={inputClass}
        />
      </div>
    )
  }

  if (def.type === 'color') {
    const materialKey = def.dependsOnMaterial ?? 'material'
    const currentMaterial = allProperties?.[materialKey] as string | undefined
    const colorOptions = currentMaterial
      ? (MATERIAL_COLORS[currentMaterial as MaterialType] ?? [])
      : []
    if (colorOptions.length === 0) return null
    return (
      <div className="flex flex-col gap-1.5">
        <span className={labelClass}>{label}</span>
        <div className="flex flex-wrap gap-1.5">
          {colorOptions.map((opt) => (
            <button
              key={opt.value}
              title={opt.label}
              aria-pressed={value === opt.value}
              onClick={() => onChange(opt.value)}
              className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-all ${
                value === opt.value
                  ? 'border-blue-500 scale-110'
                  : 'border-transparent hover:border-gray-300'
              }`}
              style={{ backgroundColor: opt.value }}
            />
          ))}
        </div>
      </div>
    )
  }

  // 'material' renders like select but falls back to all MATERIAL_OPTIONS when no options defined
  const options =
    def.type === 'material'
      ? (def.options ?? MATERIAL_OPTIONS.map((m) => ({ label: m, value: m })))
      : (def.options ?? [])

  return (
    <div className="flex flex-col gap-1">
      <Label.Root htmlFor={fieldId} className={labelClass}>
        {label}
      </Label.Root>
      <Select.Root value={value as string} onValueChange={(v) => onChange(v)}>
        <Select.Trigger
          id={fieldId}
          className="flex items-center justify-between w-full border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-700 bg-white hover:border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Select.Value />
          <Select.Icon className="text-gray-400 ml-1 shrink-0">▾</Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            className="bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
            position="popper"
            sideOffset={4}
          >
            <Select.Viewport className="p-1">
              {options.map((opt) => (
                <Select.Item
                  key={opt.value}
                  value={opt.value}
                  className="flex items-center px-3 py-1.5 text-sm rounded cursor-pointer outline-none hover:bg-blue-50 hover:text-blue-700 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-700"
                >
                  <Select.ItemText>{opt.label}</Select.ItemText>
                  <Select.ItemIndicator className="ml-auto text-blue-600">✓</Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  )
}
