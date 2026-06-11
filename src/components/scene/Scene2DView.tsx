import { useEffect, useRef, useState } from 'react'
import type { SceneItem } from '@/types'
import { useSceneStore } from '@/store'
import { SCENE_CONFIG } from '@/config/scene'
import { worldToRoomX, worldToRoomZ } from '@/utils/roomCoords'

const RULER = 36 // px, ширина/высота линеек

// ─── Grid ────────────────────────────────────────────────────────────────────

function PlanGrid({ scale, offset }: { scale: number; offset: { x: number; y: number } }) {
  const { width, depth } = SCENE_CONFIG.room
  const step = scale >= 0.3 ? 100 : scale >= 0.1 ? 500 : 1000
  const majorStep = step * 5

  const lines: React.ReactNode[] = []

  for (let x = -width / 2; x <= width / 2; x += step) {
    const sx = (x + width / 2) * scale + offset.x
    const isMajor = Math.abs(x % majorStep) < 0.1
    lines.push(
      <line
        key={`vx${x}`}
        x1={sx}
        y1={offset.y}
        x2={sx}
        y2={offset.y + depth * scale}
        stroke={isMajor ? '#c0c0c0' : '#e0e0e0'}
        strokeWidth={isMajor ? 1 : 0.5}
      />
    )
  }

  for (let z = -depth / 2; z <= depth / 2; z += step) {
    const sy = (z + depth / 2) * scale + offset.y
    const isMajor = Math.abs(z % majorStep) < 0.1
    lines.push(
      <line
        key={`hz${z}`}
        x1={offset.x}
        y1={sy}
        x2={offset.x + width * scale}
        y2={sy}
        stroke={isMajor ? '#c0c0c0' : '#e0e0e0'}
        strokeWidth={isMajor ? 1 : 0.5}
      />
    )
  }

  return <>{lines}</>
}

// ─── Room outline ─────────────────────────────────────────────────────────────

function RoomOutline({ scale, offset }: { scale: number; offset: { x: number; y: number } }) {
  const { width, depth } = SCENE_CONFIG.room
  return (
    <rect
      x={offset.x}
      y={offset.y}
      width={width * scale}
      height={depth * scale}
      fill="white"
      stroke="#888"
      strokeWidth={2}
    />
  )
}

// ─── Single element ───────────────────────────────────────────────────────────

function Element2D({
  item,
  scale,
  offset,
  isSelected,
  onSelect,
}: {
  item: SceneItem
  scale: number
  offset: { x: number; y: number }
  isSelected: boolean
  onSelect: () => void
}) {
  const cx = (item.position[0] + SCENE_CONFIG.room.width / 2) * scale + offset.x
  const cz = (item.position[2] + SCENE_CONFIG.room.depth / 2) * scale + offset.y
  const w = item.dimensions.width * scale
  const d = item.dimensions.depth * scale

  const fill =
    typeof item.properties.color === 'string' && item.properties.color.startsWith('#')
      ? item.properties.color
      : '#d4d4d4'
  const stroke = isSelected ? '#2563eb' : '#444'
  const sw = isSelected ? 2 : 1

  // SVG Y is down; negate to match Three.js right-hand Y rotation viewed from above
  const angleDeg = -(item.rotationY * 180) / Math.PI

  return (
    <g
      data-testid="element-2d"
      transform={`translate(${cx},${cz}) rotate(${angleDeg})`}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      style={{ cursor: 'pointer' }}
    >
      <rect
        x={-w / 2}
        y={-d / 2}
        width={w}
        height={d}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
      />
      {w > 40 && d > 14 && (
        <text
          x={0}
          y={0}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.min(11, d * 0.4)}
          fill="#333"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {item.name}
        </text>
      )}
    </g>
  )
}

// ─── Dimension lines ──────────────────────────────────────────────────────────

function DimensionLines({
  item,
  scale,
  offset,
}: {
  item: SceneItem
  scale: number
  offset: { x: number; y: number }
}) {
  const toSvgX = (wx: number) => (wx + SCENE_CONFIG.room.width / 2) * scale + offset.x
  const toSvgZ = (wz: number) => (wz + SCENE_CONFIG.room.depth / 2) * scale + offset.y

  const cx = item.position[0]
  const cz = item.position[2]
  const hw = item.dimensions.width / 2
  const hd = item.dimensions.depth / 2
  const GAP = 28
  const TICK = 6
  const COLOR = '#1d4ed8'
  const FSIZE = 11

  const dimY = toSvgZ(cz - hd) - GAP
  const x1svg = toSvgX(cx - hw)
  const x2svg = toSvgX(cx + hw)
  const wLabel = `${Math.round(item.dimensions.width)} мм`

  const dimX = toSvgX(cx + hw) + GAP
  const z1svg = toSvgZ(cz - hd)
  const z2svg = toSvgZ(cz + hd)
  const dLabel = `${Math.round(item.dimensions.depth)} мм`

  return (
    <g stroke={COLOR} fill={COLOR} fontSize={FSIZE} fontFamily="sans-serif">
      {/* Width dimension line */}
      <line x1={x1svg} y1={dimY} x2={x2svg} y2={dimY} strokeWidth={1} />
      <line x1={x1svg} y1={dimY - TICK} x2={x1svg} y2={dimY + TICK} strokeWidth={1} />
      <line x1={x2svg} y1={dimY - TICK} x2={x2svg} y2={dimY + TICK} strokeWidth={1} />
      <line
        x1={x1svg}
        y1={toSvgZ(cz - hd)}
        x2={x1svg}
        y2={dimY + TICK}
        strokeWidth={0.5}
        strokeDasharray="2,2"
      />
      <line
        x1={x2svg}
        y1={toSvgZ(cz - hd)}
        x2={x2svg}
        y2={dimY + TICK}
        strokeWidth={0.5}
        strokeDasharray="2,2"
      />
      <text
        x={(x1svg + x2svg) / 2}
        y={dimY - 4}
        textAnchor="middle"
        dominantBaseline="auto"
        style={{ pointerEvents: 'none' }}
      >
        {wLabel}
      </text>

      {/* Depth dimension line */}
      <line x1={dimX} y1={z1svg} x2={dimX} y2={z2svg} strokeWidth={1} />
      <line x1={dimX - TICK} y1={z1svg} x2={dimX + TICK} y2={z1svg} strokeWidth={1} />
      <line x1={dimX - TICK} y1={z2svg} x2={dimX + TICK} y2={z2svg} strokeWidth={1} />
      <line
        x1={toSvgX(cx + hw)}
        y1={z1svg}
        x2={dimX - TICK}
        y2={z1svg}
        strokeWidth={0.5}
        strokeDasharray="2,2"
      />
      <line
        x1={toSvgX(cx + hw)}
        y1={z2svg}
        x2={dimX - TICK}
        y2={z2svg}
        strokeWidth={0.5}
        strokeDasharray="2,2"
      />
      <text
        x={dimX + 4}
        y={(z1svg + z2svg) / 2}
        textAnchor="start"
        dominantBaseline="middle"
        style={{ pointerEvents: 'none' }}
      >
        {dLabel}
      </text>
    </g>
  )
}

// ─── Rulers ───────────────────────────────────────────────────────────────────

function rulerStep(scale: number): number {
  if (scale > 0.8) return 100
  if (scale > 0.3) return 500
  if (scale > 0.1) return 1000
  return 2000
}

function HorizontalRuler({
  scale,
  offset,
  containerWidth,
  rulerSize,
}: {
  scale: number
  offset: { x: number; y: number }
  containerWidth: number
  rulerSize: number
}) {
  const { width } = SCENE_CONFIG.room
  const step = rulerStep(scale)
  const ticks: React.ReactNode[] = []

  for (let wx = -width / 2; wx <= width / 2; wx += step) {
    const sx = (wx + width / 2) * scale + offset.x
    if (sx < rulerSize || sx > containerWidth) continue
    const isMajor = Math.abs(wx % (step * 5)) < 0.1
    const displayVal = Math.round(worldToRoomX(wx))
    ticks.push(
      <g key={`tx${wx}`}>
        <line
          x1={sx}
          y1={rulerSize - (isMajor ? 10 : 5)}
          x2={sx}
          y2={rulerSize}
          stroke="#888"
          strokeWidth={1}
        />
        {isMajor && (
          <text x={sx + 2} y={rulerSize - 12} fontSize={9} fill="#666">
            {displayVal}
          </text>
        )}
      </g>
    )
  }

  return (
    <g>
      <rect
        x={rulerSize}
        y={0}
        width={containerWidth - rulerSize}
        height={rulerSize}
        fill="white"
        stroke="none"
      />
      <line
        x1={rulerSize}
        y1={rulerSize}
        x2={containerWidth}
        y2={rulerSize}
        stroke="#ccc"
        strokeWidth={1}
      />
      {ticks}
    </g>
  )
}

function VerticalRuler({
  scale,
  offset,
  containerHeight,
  rulerSize,
}: {
  scale: number
  offset: { x: number; y: number }
  containerHeight: number
  rulerSize: number
}) {
  const { depth } = SCENE_CONFIG.room
  const step = rulerStep(scale)
  const ticks: React.ReactNode[] = []

  for (let wz = -depth / 2; wz <= depth / 2; wz += step) {
    const sy = (wz + depth / 2) * scale + offset.y
    if (sy < rulerSize || sy > containerHeight) continue
    const isMajor = Math.abs(wz % (step * 5)) < 0.1
    const displayVal = Math.round(worldToRoomZ(wz))
    ticks.push(
      <g key={`tz${wz}`}>
        <line
          x1={rulerSize - (isMajor ? 10 : 5)}
          y1={sy}
          x2={rulerSize}
          y2={sy}
          stroke="#888"
          strokeWidth={1}
        />
        {isMajor && (
          <text
            x={rulerSize - 12}
            y={sy + 2}
            fontSize={9}
            fill="#666"
            textAnchor="end"
            dominantBaseline="hanging"
            transform={`rotate(-90, ${rulerSize - 12}, ${sy + 2})`}
          >
            {displayVal}
          </text>
        )}
      </g>
    )
  }

  return (
    <g>
      <rect
        x={0}
        y={rulerSize}
        width={rulerSize}
        height={containerHeight - rulerSize}
        fill="white"
        stroke="none"
      />
      <line
        x1={rulerSize}
        y1={rulerSize}
        x2={rulerSize}
        y2={containerHeight}
        stroke="#ccc"
        strokeWidth={1}
      />
      {ticks}
    </g>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Scene2DView() {
  const items = useSceneStore((s) => s.items)
  const selectedItemIds = useSceneStore((s) => s.selectedItemIds)
  const selectItem = useSceneStore((s) => s.selectItem)

  const [scale, setScale] = useState(0)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [panning, setPanning] = useState(false)
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const panStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cw = rect.width
    const ch = rect.height
    const s = Math.min(
      ((cw - RULER) * 0.85) / SCENE_CONFIG.room.width,
      ((ch - RULER) * 0.85) / SCENE_CONFIG.room.depth
    )
    setScale(s)
    setOffset({
      x: RULER + (cw - RULER - SCENE_CONFIG.room.width * s) / 2,
      y: RULER + (ch - RULER - SCENE_CONFIG.room.depth * s) / 2,
    })
    setContainerSize({ w: cw, h: ch })

    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setContainerSize({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
      setScale((prev) => {
        const next = Math.min(Math.max(prev * factor, 0.03), 2)
        setOffset((o) => ({
          x: mx - (mx - o.x) * (next / prev),
          y: my - (my - o.y) * (next / prev),
        }))
        return next
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return
    setPanning(true)
    panStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y }
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!panning) return
    setOffset({
      x: panStart.current.ox + (e.clientX - panStart.current.mx),
      y: panStart.current.oy + (e.clientY - panStart.current.my),
    })
  }

  const handleMouseUp = () => setPanning(false)

  const selectedItem =
    selectedItemIds.length === 1 ? items.find((i) => i.id === selectedItemIds[0]) : undefined

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', overflow: 'hidden', background: '#f0f0f0' }}
    >
      {scale > 0 && (
        <svg
          width="100%"
          height="100%"
          style={{ cursor: panning ? 'grabbing' : 'default', display: 'block' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={() => selectItem(null)}
        >
          <PlanGrid scale={scale} offset={offset} />
          <RoomOutline scale={scale} offset={offset} />

          {items.map((item) => (
            <Element2D
              key={item.id}
              item={item}
              scale={scale}
              offset={offset}
              isSelected={selectedItemIds.includes(item.id)}
              onSelect={() => selectItem(item.id)}
            />
          ))}

          {selectedItemIds.length === 1 && selectedItem && (
            <DimensionLines item={selectedItem} scale={scale} offset={offset} />
          )}

          <HorizontalRuler
            scale={scale}
            offset={offset}
            containerWidth={containerSize.w}
            rulerSize={RULER}
          />
          <VerticalRuler
            scale={scale}
            offset={offset}
            containerHeight={containerSize.h}
            rulerSize={RULER}
          />

          {/* Corner square at ruler intersection */}
          <rect x={0} y={0} width={RULER} height={RULER} fill="white" stroke="#ccc" />
        </svg>
      )}
    </div>
  )
}
