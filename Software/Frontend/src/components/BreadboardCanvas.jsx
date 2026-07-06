import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { Stage, Layer, Rect, Circle, Line, Text, Group, Arc } from 'react-konva'
import './BreadboardCanvas.css'

// ── CONSTANTS ──
const HOLE_SPACING = 34
const HOLE_RADIUS = 3.5
const BOARD_PADDING_X = 70
const BOARD_PADDING_Y = 60
const NUM_COLS = 30
const CHANNEL_GAP = 36

// Row labels
const TOP_ROWS = ['a', 'b', 'c', 'd', 'e']
const BOTTOM_ROWS = ['f', 'g', 'h', 'i', 'j']

// Compute Y offset for each row
function buildRowYMap() {
  const map = {}
  let y = 0

  // Top power rails
  map['+_top'] = y; y += 1
  map['-_top'] = y; y += 1.8

  // Top rows a-e
  for (const r of TOP_ROWS) { map[r] = y; y += 1 }

  y += CHANNEL_GAP / HOLE_SPACING

  // Bottom rows f-j
  for (const r of BOTTOM_ROWS) { map[r] = y; y += 1 }

  y += 0.8
  map['+_bottom'] = y; y += 1
  map['-_bottom'] = y

  return map
}

const ROW_Y_MAP = buildRowYMap()
const BOARD_HEIGHT = (ROW_Y_MAP['-_bottom'] + 2) * HOLE_SPACING + BOARD_PADDING_Y * 2
const BOARD_WIDTH = (NUM_COLS + 1) * HOLE_SPACING + BOARD_PADDING_X * 2

// ── HELPERS ──
function getRowY(row, context = 'top') {
  const r = (row ?? '').toLowerCase()
  if (r === '+' || r === '-') {
    return BOARD_PADDING_Y + (ROW_Y_MAP[`${r}_${context}`] ?? 0) * HOLE_SPACING
  }
  return BOARD_PADDING_Y + (ROW_Y_MAP[r] ?? 0) * HOLE_SPACING
}

function getColX(col) {
  return BOARD_PADDING_X + (col - 1) * HOLE_SPACING
}

// Wire color mapping (Spanish → CSS)
const WIRE_COLORS = {
  rojo: '#ef4444', red: '#ef4444',
  negro: '#2d2d2d', black: '#2d2d2d',
  azul: '#3b82f6', blue: '#3b82f6',
  amarillo: '#eab308', yellow: '#eab308',
  verde: '#22c55e', green: '#22c55e',
  naranja: '#f97316', orange: '#f97316',
  blanco: '#f1f5f9', white: '#f1f5f9',
  morado: '#a855f7', purple: '#a855f7',
  gris: '#9ca3af', gray: '#9ca3af',
  café: '#92400e', brown: '#92400e',
  marrón: '#92400e',
}

function resolveWireColor(color) {
  if (!color) return '#6b7280'
  return WIRE_COLORS[color.toLowerCase().trim()] ?? '#6b7280'
}

// LED color from value
function getLedColor(value) {
  const map = {
    red: '#ef4444', rojo: '#ef4444',
    green: '#22c55e', verde: '#22c55e',
    blue: '#3b82f6', azul: '#3b82f6',
    yellow: '#eab308', amarillo: '#eab308',
    white: '#e2e8f0', blanco: '#e2e8f0',
    orange: '#f97316', naranja: '#f97316',
  }
  if (!value) return '#ef4444' // default red
  return map[value.toLowerCase()] ?? '#ef4444'
}

// ── COMPONENT COLORS BY TYPE ──
const TYPE_THEME = {
  resistor: { bg: '#fef3c7', border: '#d97706', text: '#92400e' },
  resistencia: { bg: '#fef3c7', border: '#d97706', text: '#92400e' },
  led: { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
  capacitor: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  battery: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
  bateria: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
  power_supply: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
  fuente: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
  ammeter: { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
  amperimetro: { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
  voltmeter: { bg: '#ede9fe', border: '#8b5cf6', text: '#5b21b6' },
  voltimetro: { bg: '#ede9fe', border: '#8b5cf6', text: '#5b21b6' },
  switch: { bg: '#ffedd5', border: '#f97316', text: '#9a3412' },
  interruptor: { bg: '#ffedd5', border: '#f97316', text: '#9a3412' },
}

function getTheme(type) {
  return TYPE_THEME[(type || '').toLowerCase()] ?? { bg: '#f1f5f9', border: '#64748b', text: '#334155' }
}


// ══════════════════════════════════════
//  BOARD BACKGROUND
// ══════════════════════════════════════
function BoardBackground() {
  return (
    <Group>
      {/* Shadow rect */}
      <Rect
        x={14} y={14}
        width={BOARD_WIDTH - 28} height={BOARD_HEIGHT - 28}
        fill="#e8e0d4"
        cornerRadius={14}
        shadowColor="rgba(0,0,0,0.25)"
        shadowBlur={24}
        shadowOffsetY={8}
      />
      {/* Main board */}
      <Rect
        x={12} y={12}
        width={BOARD_WIDTH - 24} height={BOARD_HEIGHT - 24}
        fill="#f7f2ea"
        cornerRadius={14}
        stroke="#ddd5c8"
        strokeWidth={1.5}
      />
      {/* Channel groove */}
      <Rect
        x={BOARD_PADDING_X - 24}
        y={(getRowY('e') + getRowY('f')) / 2 - 6}
        width={NUM_COLS * HOLE_SPACING + 48}
        height={12}
        fill="#ebe4d8"
        cornerRadius={6}
      />
    </Group>
  )
}


// ══════════════════════════════════════
//  POWER RAILS
// ══════════════════════════════════════
function PowerRail({ yPlus, yMinus }) {
  const xStart = BOARD_PADDING_X - 14
  const xEnd = BOARD_PADDING_X + (NUM_COLS - 1) * HOLE_SPACING + 14

  return (
    <Group>
      {/* + rail background stripe */}
      <Rect x={xStart - 4} y={yPlus - 8} width={xEnd - xStart + 8} height={16} fill="#fef2f2" cornerRadius={4} />
      <Line points={[xStart, yPlus, xEnd, yPlus]} stroke="#fca5a5" strokeWidth={1.5} dash={[8, 4]} />
      <Text x={xStart - 22} y={yPlus - 7} text="+" fontSize={16} fontStyle="bold" fill="#ef4444" />

      {/* − rail background stripe */}
      <Rect x={xStart - 4} y={yMinus - 8} width={xEnd - xStart + 8} height={16} fill="#eff6ff" cornerRadius={4} />
      <Line points={[xStart, yMinus, xEnd, yMinus]} stroke="#93c5fd" strokeWidth={1.5} dash={[8, 4]} />
      <Text x={xStart - 22} y={yMinus - 7} text="−" fontSize={16} fontStyle="bold" fill="#3b82f6" />
    </Group>
  )
}


// ══════════════════════════════════════
//  HOLE GRID
// ══════════════════════════════════════
function HoleGrid() {
  const holes = []
  const labels = []

  // Main rows
  for (const row of [...TOP_ROWS, ...BOTTOM_ROWS]) {
    const y = getRowY(row)
    labels.push(
      <Text key={`lbl-${row}`} x={BOARD_PADDING_X - 36} y={y - 6} text={row} fontSize={12} fontStyle="600" fill="#9ca3af" />
    )
    labels.push(
      <Text key={`lbl-${row}-r`} x={BOARD_PADDING_X + NUM_COLS * HOLE_SPACING + 4} y={y - 6} text={row} fontSize={12} fontStyle="600" fill="#9ca3af" />
    )
    for (let col = 1; col <= NUM_COLS; col++) {
      holes.push(
        <Circle key={`h-${row}-${col}`} x={getColX(col)} y={y} radius={HOLE_RADIUS}
          fill="#d4d0c8" stroke="#c5c0b5" strokeWidth={0.5} />
      )
    }
  }

  // Column numbers (top)
  for (let col = 1; col <= NUM_COLS; col++) {
    if (col <= 5 || col % 5 === 0) {
      labels.push(
        <Text key={`col-${col}`} x={getColX(col) - (col >= 10 ? 5 : 3)} y={getRowY('a') - 22}
          text={String(col)} fontSize={10} fill="#b0aaa0" fontStyle="600" />
      )
    }
  }

  // Power rail holes
  for (const ctx of ['top', 'bottom']) {
    for (const rail of ['+', '-']) {
      const y = getRowY(rail, ctx)
      for (let col = 1; col <= NUM_COLS; col++) {
        const isPlus = rail === '+'
        holes.push(
          <Circle key={`rail-${ctx}-${rail}-${col}`} x={getColX(col)} y={y} radius={HOLE_RADIUS - 0.5}
            fill={isPlus ? '#fecaca' : '#bfdbfe'} stroke={isPlus ? '#f87171' : '#60a5fa'} strokeWidth={0.4} />
        )
      }
    }
  }

  return <Group>{holes}{labels}</Group>
}


// ══════════════════════════════════════
//  COMPONENT SHAPES
// ══════════════════════════════════════
const MIN_BODY_W = 50
const MIN_BODY_H = 28

function ComponentShape({ component, isHighlighted, onHover, onLeave }) {
  const bb = component.breadboard
  if (!bb) return null

  const x1 = getColX(bb.col_start)
  const y1 = getRowY(bb.row_start)
  const x2 = getColX(bb.col_end)
  const y2 = getRowY(bb.row_end)

  const cx = (x1 + x2) / 2
  const cy = (y1 + y2) / 2
  const rawW = Math.abs(x2 - x1)
  const rawH = Math.abs(y2 - y1)
  const bodyW = Math.max(rawW, MIN_BODY_W)
  const bodyH = Math.max(rawH, MIN_BODY_H)

  const theme = getTheme(component.type)
  const typeLower = (component.type || '').toLowerCase()

  const handleMouseEnter = (e) => {
    const stage = e.target.getStage()
    const pointer = stage.getPointerPosition()
    onHover(component, pointer)
  }

  // Decide which shape to render
  let shape
  if (typeLower === 'led') {
    shape = <LedBody cx={cx} cy={cy} w={bodyW} h={bodyH} value={component.value} isHighlighted={isHighlighted} />
  } else if (typeLower === 'ammeter' || typeLower === 'amperimetro' || typeLower === 'voltmeter' || typeLower === 'voltimetro') {
    const letter = (typeLower === 'ammeter' || typeLower === 'amperimetro') ? 'A' : 'V'
    shape = <MeterBody cx={cx} cy={cy} letter={letter} theme={theme} isHighlighted={isHighlighted} />
  } else if (typeLower === 'resistor' || typeLower === 'resistencia') {
    shape = <ResistorBody cx={cx} cy={cy} w={bodyW} h={bodyH} theme={theme} isHighlighted={isHighlighted} />
  } else if (typeLower === 'battery' || typeLower === 'bateria' || typeLower === 'fuente' || typeLower === 'power_supply') {
    shape = <BatteryBody cx={cx} cy={cy} w={bodyW} h={bodyH} theme={theme} isHighlighted={isHighlighted} />
  } else if (typeLower === 'switch' || typeLower === 'interruptor') {
    shape = <SwitchBody cx={cx} cy={cy} w={bodyW} h={bodyH} theme={theme} isHighlighted={isHighlighted} />
  } else {
    shape = <GenericBody cx={cx} cy={cy} w={bodyW} h={bodyH} theme={theme} type={component.type} isHighlighted={isHighlighted} />
  }

  return (
    <Group onMouseEnter={handleMouseEnter} onMouseLeave={onLeave}>
      {/* Highlight glow */}
      {isHighlighted && (
        <Rect
          x={cx - bodyW / 2 - 10} y={cy - bodyH / 2 - 10}
          width={bodyW + 20} height={bodyH + 20}
          cornerRadius={12}
          stroke="#f59e0b" strokeWidth={3}
          fill="transparent"
          shadowColor="#f59e0b" shadowBlur={18}
          dash={[6, 4]}
        />
      )}

      {/* Pin markers at actual breadboard positions */}
      <Circle x={x1} y={y1} radius={4.5} fill={theme.border} stroke="#fff" strokeWidth={1.5} />
      <Circle x={x2} y={y2} radius={4.5} fill={theme.border} stroke="#fff" strokeWidth={1.5} />

      {/* Thin lead lines from pin to body edge */}
      <Line points={[x1, y1, cx - bodyW / 2, cy]} stroke={theme.border} strokeWidth={2} lineCap="round" opacity={0.6} />
      <Line points={[x2, y2, cx + bodyW / 2, cy]} stroke={theme.border} strokeWidth={2} lineCap="round" opacity={0.6} />

      {/* Component body */}
      {shape}

      {/* ID label (above) */}
      <Group>
        <Rect
          x={cx - 20} y={cy - bodyH / 2 - 22}
          width={40} height={16}
          fill="rgba(255,255,255,0.85)" cornerRadius={4}
          stroke={theme.border} strokeWidth={0.8}
        />
        <Text
          x={cx - 20} y={cy - bodyH / 2 - 20}
          width={40} height={14}
          text={component.id} fontSize={10} fontStyle="bold"
          fill={theme.text} align="center" verticalAlign="middle"
        />
      </Group>

      {/* Value label (below) */}
      {component.value && !['null', 'none', 'unknown'].includes(component.value.toLowerCase()) && (
        <Text
          x={cx - 30} y={cy + bodyH / 2 + 8}
          width={60}
          text={component.value} fontSize={10}
          fill="#6b7280" align="center"
        />
      )}
    </Group>
  )
}


// ── Resistor Body ──
function ResistorBody({ cx, cy, w, h, theme, isHighlighted }) {
  const bw = Math.max(w, 54)
  const bh = Math.max(h, 22)
  return (
    <Group>
      <Rect
        x={cx - bw / 2} y={cy - bh / 2}
        width={bw} height={bh}
        fill={theme.bg} stroke={isHighlighted ? '#f59e0b' : theme.border}
        strokeWidth={isHighlighted ? 2.5 : 1.8} cornerRadius={5}
        shadowColor="rgba(0,0,0,0.1)" shadowBlur={4} shadowOffsetY={2}
      />
      {/* Color bands */}
      {[0.2, 0.35, 0.5, 0.65, 0.8].map((pct, i) => (
        <Rect key={i}
          x={cx - bw / 2 + bw * pct - 1.5} y={cy - bh / 2 + 3}
          width={3} height={bh - 6}
          fill={['#92400e', '#1e1e1e', '#dc2626', '#eab308', '#d97706'][i]}
          cornerRadius={1}
        />
      ))}
    </Group>
  )
}


// ── Battery Body ──
function BatteryBody({ cx, cy, w, h, theme, isHighlighted }) {
  const bw = Math.max(w, 48)
  const bh = Math.max(h, 30)
  return (
    <Group>
      <Rect
        x={cx - bw / 2} y={cy - bh / 2}
        width={bw} height={bh}
        fill={theme.bg} stroke={isHighlighted ? '#f59e0b' : theme.border}
        strokeWidth={isHighlighted ? 2.5 : 1.8} cornerRadius={6}
        shadowColor="rgba(0,0,0,0.1)" shadowBlur={4} shadowOffsetY={2}
      />
      {/* + sign on left */}
      <Text x={cx - bw / 2 + 4} y={cy - 7} text="+" fontSize={14} fontStyle="bold" fill="#ef4444" />
      {/* Battery cell bars */}
      <Rect x={cx - 4} y={cy - bh / 2 + 4} width={3} height={bh - 8} fill={theme.border} cornerRadius={1} />
      <Rect x={cx + 4} y={cy - bh / 2 + 6} width={2} height={bh - 12} fill={theme.border} cornerRadius={1} />
      {/* − sign on right */}
      <Text x={cx + bw / 2 - 14} y={cy - 7} text="−" fontSize={14} fontStyle="bold" fill="#3b82f6" />
    </Group>
  )
}


// ── LED Body ──
function LedBody({ cx, cy, w, h, value, isHighlighted }) {
  const color = getLedColor(value)
  const r = Math.max(Math.min(w, h) / 2, 16)
  return (
    <Group>
      {/* Outer glow */}
      <Circle x={cx} y={cy} radius={r + 8} fill={color} opacity={isHighlighted ? 0.3 : 0.12} />
      {/* LED body */}
      <Circle x={cx} y={cy} radius={r}
        fill={color} stroke={isHighlighted ? '#f59e0b' : '#fff'}
        strokeWidth={isHighlighted ? 2.5 : 2}
        shadowColor={color} shadowBlur={isHighlighted ? 24 : 10}
      />
      {/* Inner shine */}
      <Circle x={cx - r * 0.22} y={cy - r * 0.22} radius={r * 0.3}
        fill="rgba(255,255,255,0.5)" />
      {/* Triangle arrow indicator */}
      <Line
        points={[cx - 5, cy - 6, cx + 5, cy, cx - 5, cy + 6]}
        fill="rgba(255,255,255,0.35)" closed stroke="rgba(255,255,255,0.5)" strokeWidth={0.8}
      />
    </Group>
  )
}


// ── Meter Body (Ammeter/Voltmeter) ──
function MeterBody({ cx, cy, letter, theme, isHighlighted }) {
  return (
    <Group>
      <Circle x={cx} y={cy} radius={18}
        fill={theme.bg} stroke={isHighlighted ? '#f59e0b' : theme.border}
        strokeWidth={isHighlighted ? 2.5 : 2}
        shadowColor="rgba(0,0,0,0.1)" shadowBlur={6} shadowOffsetY={2}
      />
      <Text x={cx - 7} y={cy - 8} text={letter} fontSize={16} fontStyle="bold" fill={theme.text} />
    </Group>
  )
}


// ── Switch Body ──
function SwitchBody({ cx, cy, w, h, theme, isHighlighted }) {
  const bw = Math.max(w, 44)
  return (
    <Group>
      <Rect
        x={cx - bw / 2} y={cy - 10} width={bw} height={20}
        fill={theme.bg} stroke={isHighlighted ? '#f59e0b' : theme.border}
        strokeWidth={isHighlighted ? 2.5 : 1.8} cornerRadius={10}
        shadowColor="rgba(0,0,0,0.1)" shadowBlur={4} shadowOffsetY={2}
      />
      {/* Toggle indicator */}
      <Circle x={cx + 6} y={cy} radius={6} fill={theme.border} />
      <Line points={[cx - bw / 2 + 6, cy, cx + 6, cy]} stroke={theme.border} strokeWidth={2} lineCap="round" />
    </Group>
  )
}


// ── Generic Body ──
function GenericBody({ cx, cy, w, h, theme, type, isHighlighted }) {
  const bw = Math.max(w, 48)
  const bh = Math.max(h, 24)
  return (
    <Group>
      <Rect
        x={cx - bw / 2} y={cy - bh / 2}
        width={bw} height={bh}
        fill={theme.bg} stroke={isHighlighted ? '#f59e0b' : theme.border}
        strokeWidth={isHighlighted ? 2.5 : 1.8} cornerRadius={6}
        shadowColor="rgba(0,0,0,0.1)" shadowBlur={4} shadowOffsetY={2}
      />
      <Text
        x={cx - bw / 2 + 4} y={cy - 6}
        width={bw - 8}
        text={(type || '?').slice(0, 6)} fontSize={11} fontStyle="bold"
        fill={theme.text} align="center"
      />
    </Group>
  )
}


// ══════════════════════════════════════
//  WIRE CONNECTIONS
// ══════════════════════════════════════
function WireConnection({ connection, index }) {
  const bb = connection.breadboard
  if (!bb) return null

  const fromX = getColX(bb.from_col)
  const fromY = getRowY(bb.from_row)
  const toX = getColX(bb.to_col)
  const toY = getRowY(bb.to_row)

  const color = resolveWireColor(connection.wire_color)

  // Create a nice curved cable path
  const dx = toX - fromX
  const dy = toY - fromY
  const dist = Math.sqrt(dx * dx + dy * dy)
  // Offset the midpoint perpendicular to the line for a cable droop effect
  const midX = (fromX + toX) / 2
  const midY = (fromY + toY) / 2
  const droop = Math.min(dist * 0.25, 30) + (index % 3) * 6

  // Perpendicular direction for variety
  const angle = Math.atan2(dy, dx) + Math.PI / 2
  const ctrlX = midX + Math.cos(angle) * droop
  const ctrlY = midY + Math.sin(angle) * droop

  return (
    <Group>
      {/* Wire shadow */}
      <Line
        points={[fromX, fromY, ctrlX + 1, ctrlY + 2, toX, toY]}
        stroke="rgba(0,0,0,0.12)" strokeWidth={5.5}
        lineCap="round" lineJoin="round" tension={0.45}
      />
      {/* Wire body */}
      <Line
        points={[fromX, fromY, ctrlX, ctrlY, toX, toY]}
        stroke={color} strokeWidth={4}
        lineCap="round" lineJoin="round" tension={0.45}
      />
      {/* Wire highlight streak */}
      <Line
        points={[fromX, fromY, ctrlX, ctrlY - 1, toX, toY]}
        stroke="rgba(255,255,255,0.18)" strokeWidth={1.5}
        lineCap="round" lineJoin="round" tension={0.45}
      />
      {/* Endpoint dots */}
      <Circle x={fromX} y={fromY} radius={4.5} fill={color} stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} />
      <Circle x={toX} y={toY} radius={4.5} fill={color} stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} />
    </Group>
  )
}


// ══════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════
export default function BreadboardCanvas({ circuit, activeComponentId }) {
  const containerRef = useRef(null)
  const [stageSize, setStageSize] = useState({ width: 800, height: 520 })
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [tooltip, setTooltip] = useState(null)

  // Resize observer — fit board to container
  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect
        const fitScale = Math.min(width / BOARD_WIDTH, 1)
        setStageSize({ width, height: Math.max(BOARD_HEIGHT * fitScale + 20, 420) })
        setScale(fitScale)
        setPosition({ x: (width - BOARD_WIDTH * fitScale) / 2, y: 10 })
      }
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const handleWheel = useCallback((e) => {
    e.evt.preventDefault()
    const scaleBy = 1.1
    const stage = e.target.getStage()
    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }

    const direction = e.evt.deltaY > 0 ? -1 : 1
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy
    const clampedScale = Math.max(0.25, Math.min(4, newScale))

    setScale(clampedScale)
    setPosition({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    })
  }, [])

  const handleDragEnd = useCallback((e) => {
    setPosition({ x: e.target.x(), y: e.target.y() })
  }, [])

  const handleComponentHover = useCallback((component, pointer) => {
    setTooltip({ x: pointer.x, y: pointer.y, component })
  }, [])

  const handleComponentLeave = useCallback(() => {
    setTooltip(null)
  }, [])

  const zoomIn = () => setScale((s) => Math.min(4, s * 1.25))
  const zoomOut = () => setScale((s) => Math.max(0.25, s / 1.25))
  const zoomReset = () => {
    const w = containerRef.current?.clientWidth || 800
    const fitScale = Math.min(w / BOARD_WIDTH, 1)
    setScale(fitScale)
    setPosition({ x: (w - BOARD_WIDTH * fitScale) / 2, y: 10 })
  }

  const components = circuit?.components ?? []
  const connections = circuit?.connections ?? []

  // Legend wire colors
  const wireColors = useMemo(() => {
    const colors = new Map()
    for (const conn of connections) {
      if (conn.wire_color) {
        colors.set(conn.wire_color, resolveWireColor(conn.wire_color))
      }
    }
    return colors
  }, [connections])

  return (
    <div className="breadboard-wrapper">
      {/* Toolbar */}
      <div className="breadboard-toolbar">
        <div className="breadboard-toolbar-group">
          <span className="breadboard-toolbar-label">Protoboard</span>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            {components.length} comp · {connections.length} cables
          </span>
        </div>
        <div className="breadboard-toolbar-group">
          <button className="zoom-btn" onClick={zoomOut} title="Alejar">−</button>
          <span className="zoom-label">{Math.round(scale * 100)}%</span>
          <button className="zoom-btn" onClick={zoomIn} title="Acercar">+</button>
          <button className="zoom-btn" onClick={zoomReset} title="Ajustar" style={{ fontSize: '12px' }}>⟳</button>
        </div>
      </div>

      {/* Canvas */}
      <div className="breadboard-stage-container" ref={containerRef}>
        <Stage
          width={stageSize.width}
          height={stageSize.height}
          scaleX={scale}
          scaleY={scale}
          x={position.x}
          y={position.y}
          draggable
          onDragEnd={handleDragEnd}
          onWheel={handleWheel}
        >
          <Layer>
            <BoardBackground />

            <PowerRail yPlus={getRowY('+', 'top')} yMinus={getRowY('-', 'top')} />
            <PowerRail yPlus={getRowY('+', 'bottom')} yMinus={getRowY('-', 'bottom')} />

            <HoleGrid />

            {/* Wires (behind components) */}
            {connections.map((conn, i) => (
              <WireConnection key={`wire-${i}`} connection={conn} index={i} />
            ))}

            {/* Components (on top) */}
            {components.map((comp) => (
              <ComponentShape
                key={comp.id}
                component={comp}
                isHighlighted={activeComponentId === comp.id}
                onHover={handleComponentHover}
                onLeave={handleComponentLeave}
              />
            ))}
          </Layer>
        </Stage>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="breadboard-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          <div className="breadboard-tooltip-title">
            {tooltip.component.id} — {tooltip.component.type}
          </div>
          <div className="breadboard-tooltip-detail">
            {tooltip.component.value && <>Valor: {tooltip.component.value}<br /></>}
            {tooltip.component.breadboard && (
              <>
                Pos: {tooltip.component.breadboard.row_start}{tooltip.component.breadboard.col_start}
                {' → '}{tooltip.component.breadboard.row_end}{tooltip.component.breadboard.col_end}
                <br />
              </>
            )}
            Pines: {tooltip.component.pins?.map((p) => p.name).join(', ')}
          </div>
        </div>
      )}

      {/* Legend */}
      {wireColors.size > 0 && (
        <div className="breadboard-legend">
          <span className="legend-item" style={{ fontWeight: 600, color: '#94a3b8' }}>Cables:</span>
          {[...wireColors.entries()].map(([name, hex]) => (
            <span key={name} className="legend-item">
              <span className="legend-swatch" style={{ background: hex, border: hex === '#2d2d2d' ? '1px solid #64748b' : undefined }} />
              {name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
