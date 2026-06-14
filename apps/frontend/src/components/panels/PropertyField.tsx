import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

const labelClass = 'text-xs text-gray-400 font-normal'

export function PropertyField({ def, value, onChange, allProperties }: PropertyFieldProps) {
  const label = def.unit ? `${def.label}, ${def.unit}` : def.label
  const fieldId = `field-${def.key}`

  if (def.type === 'number') {
    return (
      <div className="flex flex-col gap-1">
        <Label htmlFor={fieldId} className={labelClass}>
          {label}
        </Label>
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
      <Label htmlFor={fieldId} className={labelClass}>
        {label}
      </Label>
      <Select value={value as string} onValueChange={(v) => v !== null && onChange(v)}>
        <SelectTrigger
          id={fieldId}
          className="w-full border-gray-200 text-gray-700 bg-white hover:border-gray-300 focus:border-blue-400 focus:ring-blue-100"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
