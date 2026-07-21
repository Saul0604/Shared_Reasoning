import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { Stage, Layer, Rect, Circle, Line, Text, Group, Arc, Path } from 'react-konva'
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
      {/* Light modern drop shadow */}
      <Rect
        x={14} y={14}
        width={BOARD_WIDTH - 28} height={BOARD_HEIGHT - 28}
        fill="#f1f5f9"
        cornerRadius={12}
        shadowColor="rgba(0,0,0,0.05)"
        shadowBlur={16}
        shadowOffsetY={6}
      />
      {/* Main board body (pure crisp white) */}
      <Rect
        x={12} y={12}
        width={BOARD_WIDTH - 24} height={BOARD_HEIGHT - 24}
        fill="#ffffff"
        cornerRadius={12}
        stroke="#e2e8f0"
        strokeWidth={1.5}
      />
      {/* Central horizontal divider groove */}
      <Rect
        x={BOARD_PADDING_X - 24}
        y={(getRowY('e') + getRowY('f')) / 2 - 3}
        width={NUM_COLS * HOLE_SPACING + 48}
        height={6}
        fill="#e2e8f0"
        cornerRadius={1}
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
      {/* Continuous solid red line for positive rail */}
      <Line points={[xStart, yPlus, xEnd, yPlus]} stroke="#ef4444" strokeWidth={1.5} />
      <Text x={xStart - 20} y={yPlus - 8} text="+" fontSize={15} fontStyle="bold" fill="#ef4444" />

      {/* Continuous solid blue line for negative rail */}
      <Line points={[xStart, yMinus, xEnd, yMinus]} stroke="#3b82f6" strokeWidth={1.5} />
      <Text x={xStart - 20} y={yMinus - 8} text="−" fontSize={15} fontStyle="bold" fill="#3b82f6" />
    </Group>
  )
}


// ══════════════════════════════════════
//  HOLE GRID
// ══════════════════════════════════════
function HoleGrid() {
  const holes = []
  const labels = []

  // Main row labels (a-j)
  for (const row of [...TOP_ROWS, ...BOTTOM_ROWS]) {
    const y = getRowY(row)
    labels.push(
      <Text key={`lbl-${row}`} x={BOARD_PADDING_X - 36} y={y - 6} text={row.toUpperCase()} fontSize={12} fontStyle="bold" fill="#475569" />
    )
    labels.push(
      <Text key={`lbl-${row}-r`} x={BOARD_PADDING_X + NUM_COLS * HOLE_SPACING + 12} y={y - 6} text={row.toUpperCase()} fontSize={12} fontStyle="bold" fill="#475569" />
    )
    // Sockets for holes (dark inside, light grey border)
    for (let col = 1; col <= NUM_COLS; col++) {
      holes.push(
        <Circle key={`h-${row}-${col}`} x={getColX(col)} y={y} radius={3.2}
          fill="#374151" stroke="#e2e8f0" strokeWidth={0.8} />
      )
    }
  }

  // Column numbers (top)
  for (let col = 1; col <= NUM_COLS; col++) {
    if (col <= 5 || col % 5 === 0) {
      labels.push(
        <Text key={`col-${col}`} x={getColX(col) - (col >= 10 ? 6 : 3)} y={getRowY('a') - 22}
          text={String(col)} fontSize={10} fill="#475569" fontStyle="bold" />
      )
    }
  }

  // Power rail holes (same dark socket visual style)
  for (const ctx of ['top', 'bottom']) {
    for (const rail of ['+', '-']) {
      const y = getRowY(rail, ctx)
      for (let col = 1; col <= NUM_COLS; col++) {
        holes.push(
          <Circle key={`rail-${ctx}-${rail}-${col}`} x={getColX(col)} y={y} radius={3.2}
            fill="#374151" stroke="#e2e8f0" strokeWidth={0.8} />
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
  const [isHovered, setIsHovered] = useState(false)
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

  const typeLower = (component.type || '').toLowerCase()
  const theme = getTheme(component.type)

  // Usar tamaños fijos para el cuerpo de los componentes.
  // Las patitas se estiraran hacia los pines, pero el cuerpo mantendra su proporcion realista.
  let bodyW = MIN_BODY_W
  let bodyH = MIN_BODY_H

  if (typeLower === 'resistor' || typeLower === 'resistencia') {
    bodyW = 54
    bodyH = 14
  } else if (typeLower === 'diode' || typeLower === 'diodo') {
    bodyW = 50
    bodyH = 11
  } else if (typeLower === 'battery' || typeLower === 'bateria' || typeLower === 'fuente' || typeLower === 'power_supply' || typeLower === 'voltage_source') {
    bodyW = 54
    bodyH = 30
  } else if (typeLower === 'led') {
    bodyW = 28
    bodyH = 28
  } else if (typeLower === 'ammeter' || typeLower === 'amperimetro' || typeLower === 'voltmeter' || typeLower === 'voltimetro') {
    bodyW = 44
    bodyH = 44
  } else if (typeLower === 'capacitor' || typeLower === 'condensador') {
    bodyW = 24
    bodyH = 24
  } else if (typeLower === 'switch' || typeLower === 'interruptor') {
    bodyW = 40
    bodyH = 20
  }

  const handleMouseEnter = (e) => {
    setIsHovered(true)
    const stage = e.target.getStage()
    const pointer = stage.getPointerPosition()
    onHover(component, pointer)
  }

  const handleMouseLeave = (e) => {
    setIsHovered(false)
    if (onLeave) onLeave(e)
  }

  // Decide which shape to render
  let shape
  if (typeLower === 'led') {
    shape = <LedBody cx={cx} cy={cy} w={bodyW} h={bodyH} value={component.value} isHighlighted={isHighlighted} x1={x1} y1={y1} x2={x2} y2={y2} />
  } else if (typeLower === 'ammeter' || typeLower === 'amperimetro' || typeLower === 'voltmeter' || typeLower === 'voltimetro') {
    const letter = (typeLower === 'ammeter' || typeLower === 'amperimetro') ? 'A' : 'V'
    shape = <MeterBody cx={cx} cy={cy} letter={letter} theme={theme} isHighlighted={isHighlighted} x1={x1} y1={y1} x2={x2} y2={y2} />
  } else if (typeLower === 'resistor' || typeLower === 'resistencia') {
    shape = <ResistorBody cx={cx} cy={cy} w={bodyW} h={bodyH} theme={theme} isHighlighted={isHighlighted} value={component.value} x1={x1} y1={y1} x2={x2} y2={y2} />
  } else if (typeLower === 'battery' || typeLower === 'bateria' || typeLower === 'fuente' || typeLower === 'power_supply' || typeLower === 'voltage_source') {
    shape = <BatteryBody cx={cx} cy={cy} w={bodyW} h={bodyH} theme={theme} isHighlighted={isHighlighted} x1={x1} y1={y1} x2={x2} y2={y2} />
  } else if (typeLower === 'switch' || typeLower === 'interruptor') {
    shape = <SwitchBody cx={cx} cy={cy} w={bodyW} h={bodyH} theme={theme} isHighlighted={isHighlighted} x1={x1} y1={y1} x2={x2} y2={y2} />
  } else if (typeLower === 'capacitor' || typeLower === 'condensador') {
    shape = <CapacitorBody cx={cx} cy={cy} w={bodyW} h={bodyH} theme={theme} isHighlighted={isHighlighted} x1={x1} y1={y1} x2={x2} y2={y2} />
  } else if (typeLower === 'diode' || typeLower === 'diodo') {
    shape = <DiodeBody cx={cx} cy={cy} w={bodyW} h={bodyH} theme={theme} isHighlighted={isHighlighted} value={component.value} x1={x1} y1={y1} x2={x2} y2={y2} />
  } else {
    shape = <GenericBody cx={cx} cy={cy} w={bodyW} h={bodyH} theme={theme} type={component.type} isHighlighted={isHighlighted} x1={x1} y1={y1} x2={x2} y2={y2} />
  }

  return (
    <Group onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
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

      {/* Component body */}
      {shape}

      {/* Labels - Only visible on hover or when highlighted */}
      {(isHovered || isHighlighted) && (
        <Group>
          {/* ID label (above) - Minimal style */}
          <Text
            x={cx - 30} y={cy - bodyH / 2 - 14}
            width={60} height={14}
            text={component.id} fontSize={10} fontStyle="bold"
            fill={theme.text} align="center" verticalAlign="bottom"
            stroke="#ffffff" strokeWidth={3} fillAfterStrokeEnabled={true}
          />

          {/* Value label (below) - Minimal style */}
          {component.value && !['null', 'none', 'unknown'].includes(component.value.toLowerCase()) && (
            <Text
              x={cx - 40} y={cy + bodyH / 2 + 2}
              width={80}
              text={component.value} fontSize={9} fontStyle="bold"
              fill="#475569" align="center"
              stroke="#ffffff" strokeWidth={3} fillAfterStrokeEnabled={true}
            />
          )}
        </Group>
      )}
    </Group>
  )
}

// Helper to parse resistor value and return correct 4-band colors (Spanish/English compatible)
function getResistorBands(valueStr) {
  const defaultBands = ['#92400e', '#1e1e1e', '#dc2626', '#d97706'] // Brown, Black, Red, Gold (1k)
  if (!valueStr) return defaultBands

  // Clean value (e.g. "1k", "220 ohms", "10k", "4.7k")
  let val = valueStr.toLowerCase().replace(/[\sΩohms]/g, '')
  let multiplier = 1
  if (val.includes('k')) {
    multiplier = 1000
    val = val.replace('k', '')
  } else if (val.includes('m')) {
    multiplier = 1000000
    val = val.replace('m', '')
  }

  const num = parseFloat(val) * multiplier
  if (isNaN(num) || num < 1) return defaultBands

  const strExp = num.toExponential(1)
  const parts = strExp.split('e')
  const base = parts[0].replace('.', '')
  const exp = parseInt(parts[1]) - 1

  const colorMap = [
    '#1e1e1e', // 0: Black
    '#92400e', // 1: Brown
    '#dc2626', // 2: Red
    '#f97316', // 3: Orange
    '#eab308', // 4: Yellow
    '#22c55e', // 5: Green
    '#3b82f6', // 6: Blue
    '#a855f7', // 7: Violet (Purple)
    '#6b7280', // 8: Grey
    '#f8fafc'  // 9: White
  ]

  const d1 = parseInt(base[0])
  const d2 = parseInt(base[1] || '0')
  const mult = exp

  const band1 = colorMap[d1] ?? '#92400e'
  const band2 = colorMap[d2] ?? '#1e1e1e'
  const band3 = colorMap[mult] ?? '#dc2626'
  const band4 = '#d97706' // Gold (5% tolerance)

  return [band1, band2, band3, band4]
}

// ── Resistor Body ──
function ResistorBody({ cx, cy, w, h, theme, isHighlighted, value, x1, y1, x2, y2 }) {
  const bw = Math.max(w, 54)
  const bh = 14 // flat profile height
  const bands = getResistorBands(value)

  return (
    <Group>
      {/* Resistor leads (thin metal wires connecting holes to body) */}
      <Line points={[x1, y1, cx - bw / 2, cy]} stroke="#b0bec5" strokeWidth={1.5} lineCap="round" />
      <Line points={[x2, y2, cx + bw / 2, cy]} stroke="#b0bec5" strokeWidth={1.5} lineCap="round" />

      {/* Flat resistor body */}
      <Rect
        x={cx - bw / 2}
        y={cy - bh / 2}
        width={bw}
        height={bh}
        fill={theme.bg}
        stroke={isHighlighted ? '#ef4444' : '#bcaaa4'}
        strokeWidth={isHighlighted ? 2 : 1.2}
        cornerRadius={3}
      />

      {/* Resistor bands (solid vertical blocks) */}
      {[0.25, 0.4, 0.55, 0.7].map((pct, i) => {
        const bandX = cx - bw / 2 + bw * pct
        return (
          <Rect
            key={i}
            x={bandX - 2}
            y={cy - bh / 2}
            width={4}
            height={bh}
            fill={bands[i]}
          />
        )
      })}
    </Group>
  )
}

// ── Diode Body ──
function DiodeBody({ cx, cy, w, h, theme, isHighlighted, value, x1, y1, x2, y2 }) {
  const bw = Math.max(w, 50)
  const bh = 11 // slightly thinner than a resistor

  const isGlass = (value || '').toLowerCase().includes('4148')
  const bodyColor = isGlass ? '#ff7043' : '#374151' // Orange glass for 1N4148, dark grey for rectifier
  const stripeColor = isGlass ? '#212121' : '#b0bec5' // Black stripe for 1N4148, silver stripe for rectifier
  const borderColor = isGlass ? '#d84315' : '#212121'

  return (
    <Group>
      {/* Diode leads */}
      <Line points={[x1, y1, cx - bw / 2, cy]} stroke="#b0bec5" strokeWidth={1.5} lineCap="round" />
      <Line points={[x2, y2, cx + bw / 2, cy]} stroke="#b0bec5" strokeWidth={1.5} lineCap="round" />

      {/* Flat diode body */}
      <Rect
        x={cx - bw / 2}
        y={cy - bh / 2}
        width={bw}
        height={bh}
        fill={bodyColor}
        stroke={isHighlighted ? '#ef4444' : borderColor}
        strokeWidth={isHighlighted ? 2 : 1.2}
        cornerRadius={1.5}
      />

      {/* Cathode Stripe (on the right end, near negative lead) */}
      <Rect
        x={cx + bw / 2 - 6}
        y={cy - bh / 2}
        width={2.5}
        height={bh}
        fill={stripeColor}
      />
    </Group>
  )
}

// ── Capacitor Body ──
function CapacitorBody({ cx, cy, w, h, theme, isHighlighted, x1, y1, x2, y2 }) {
  const r = 12

  return (
    <Group>
      {/* Metal lead lines from breadboard pins to the capacitor body */}
      <Line points={[x1, y1, cx, cy]} stroke="#b0bec5" strokeWidth={1.5} lineCap="round" />
      <Line points={[x2, y2, cx, cy]} stroke="#b0bec5" strokeWidth={1.5} lineCap="round" />

      {/* Flat circular capacitor case (top-down view) */}
      <Circle
        x={cx}
        y={cy}
        radius={r}
        fill="#263238" // charcoal body
        stroke={isHighlighted ? '#ef4444' : '#374151'}
        strokeWidth={isHighlighted ? 2 : 1.2}
      />

      {/* Cathode/Negative stripe (crescent arc) */}
      <Arc
        x={cx}
        y={cy}
        innerRadius={8.5}
        outerRadius={11.5}
        angle={120}
        rotation={300}
        fill="#cfd8dc" // light grey stripe
      />

      {/* Minus sign text inside the negative stripe */}
      <Text
        x={cx + 5}
        y={cy - 4}
        text="-"
        fontSize={10}
        fontStyle="bold"
        fill="#374151"
      />

      {/* Vent notches (cross in the center) */}
      <Line points={[cx - 3, cy, cx + 3, cy]} stroke="#455a64" strokeWidth={1} />
      <Line points={[cx, cy - 3, cx, cy + 3]} stroke="#455a64" strokeWidth={1} />
    </Group>
  )
}

// ── Battery Body ──
function BatteryBody({ cx, cy, w, h, theme, isHighlighted, x1, y1, x2, y2 }) {
  const bw = Math.max(w, 54)
  const bh = 30

  return (
    <Group>
      {/* Wokwi battery wire leads (red for positive, black for negative) */}
      <Line points={[x1, y1, cx - bw / 2, cy - 6]} stroke="#ef4444" strokeWidth={1.5} tension={0.5} lineCap="round" />
      <Line points={[x2, y2, cx - bw / 2, cy + 6]} stroke="#212121" strokeWidth={1.5} tension={0.5} lineCap="round" />

      {/* Battery Body (Flat rectangle) */}
      <Rect
        x={cx - bw / 2} y={cy - bh / 2}
        width={bw} height={bh}
        fill="#212121"
        stroke={isHighlighted ? '#ef4444' : '#424242'}
        strokeWidth={isHighlighted ? 2 : 1.2}
        cornerRadius={3}
      />

      {/* Metal terminals collar */}
      <Rect
        x={cx - bw / 2}
        y={cy - bh / 2 + 1}
        width={5}
        height={bh - 2}
        fill="#90a4ae"
        cornerRadius={[2, 0, 0, 2]}
      />

      {/* Blue branding/collar stripe */}
      <Rect
        x={cx - bw / 2 + 10}
        y={cy - bh / 2 + 1}
        width={bw - 20}
        height={6}
        fill="#1e88e5"
      />

      {/* Labels */}
      <Text x={cx - 14} y={cy - 4} text={theme.text === '#065f46' ? 'PWR' : '9V'} fontSize={9} fontStyle="bold" fill="#ffffff" />

      <Text x={cx - bw / 2 + 8} y={cy - 12} text="+" fontSize={10} fontStyle="bold" fill="#ef4444" />
      <Text x={cx - bw / 2 + 8} y={cy + 2} text="-" fontSize={12} fontStyle="bold" fill="#60a5fa" />
    </Group>
  )
}

// ── LED Body ──
function LedBody({ cx, cy, w, h, value, isHighlighted, x1, y1, x2, y2 }) {
  const color = getLedColor(value)
  const r = 14

  const darkColors = {
    '#ef4444': '#b91c1c', // Red
    '#22c55e': '#15803d', // Green
    '#3b82f6': '#1d4ed8', // Blue
    '#eab308': '#a16207', // Yellow
    '#e2e8f0': '#cbd5e1', // White
    '#f97316': '#c2410c'  // Orange
  }
  const darkColor = darkColors[color] ?? '#374151'

  // Wokwi LED outline path (circle with flat edge on the right to represent cathode)
  const ledPath = `M ${cx + 11} ${cy - 8.6} A ${r} ${r} 0 1 0 ${cx + 11} ${cy + 8.6} Z`

  return (
    <Group>
      {/* Wokwi LED lead wires (connecting breadboard holes to anode/cathode) */}
      <Line points={[x1, y1, cx - 4, cy + r - 2]} stroke="#94a3b8" strokeWidth={1.5} lineCap="round" />
      <Line points={[x2, y2, cx + 4, cy + r - 2]} stroke="#94a3b8" strokeWidth={1.5} lineCap="round" />

      {/* On glow (when highlighted) */}
      {isHighlighted && (
        <Circle
          x={cx}
          y={cy}
          radius={r + 8}
          fill={color}
          opacity={0.25}
        />
      )}

      {/* Internal Anode/Cathode leads (visible inside translucent LED) */}
      {/* Left Lead (Anode) */}
      <Line
        points={[cx - 4, cy + r - 2, cx - 4, cy, cx - 6, cy - 4]}
        stroke="#cbd5e1"
        strokeWidth={1.2}
        lineCap="round"
      />
      {/* Right Lead (Cathode Flag) */}
      <Line
        points={[cx + 3, cy + r - 2, cx + 3, cy, cx + 1, cy - 5, cx + 5, cy - 5]}
        stroke="#cbd5e1"
        strokeWidth={1.2}
        closed
        fill="#b8c2cc"
      />

      {/* Translucent Dome */}
      <Path
        data={ledPath}
        fill={color}
        opacity={0.75}
        stroke={darkColor}
        strokeWidth={1.5}
      />

      {/* Base ring lip */}
      <Circle
        x={cx}
        y={cy}
        radius={r}
        stroke={darkColor}
        strokeWidth={0.8}
        opacity={0.3}
      />
    </Group>
  )
}

// ── Meter Body (Ammeter/Voltmeter) ──
function MeterBody({ cx, cy, letter, theme, isHighlighted, x1, y1, x2, y2 }) {
  const mw = 44
  const mh = 44
  const isAmmeter = letter === 'A'

  return (
    <Group>
      {/* Multimeter Probes Wires */}
      <Line points={[x1, y1, cx - 10, cy + mh / 2]} stroke="#ef4444" strokeWidth={1.5} tension={0.5} lineCap="round" />
      <Line points={[x2, y2, cx + 10, cy + mh / 2]} stroke="#212121" strokeWidth={1.5} tension={0.5} lineCap="round" />

      {/* Yellow Case (flat color block) */}
      <Rect
        x={cx - mw / 2} y={cy - mh / 2}
        width={mw} height={mh}
        fill="#fbc02d" // flat yellow
        stroke={isHighlighted ? '#ef4444' : '#f57f17'}
        strokeWidth={isHighlighted ? 2 : 1.2}
        cornerRadius={4}
      />

      {/* LCD Screen Border */}
      <Rect
        x={cx - mw / 2 + 4} y={cy - mh / 2 + 4}
        width={mw - 8} height={14}
        fill="#374151"
        cornerRadius={1}
      />

      {/* LCD Screen */}
      <Rect
        x={cx - mw / 2 + 5} y={cy - mh / 2 + 5}
        width={mw - 10} height={12}
        fill="#e0f2f1"
        cornerRadius={0.5}
      />

      {/* LCD Value Text */}
      <Text
        x={cx - mw / 2 + 5} y={cy - mh / 2 + 7}
        width={mw - 10}
        text={isAmmeter ? "0.00 A" : "0.00 V"}
        fontSize={8}
        fontFamily="Courier New, monospace"
        fontStyle="bold"
        fill="#004d40"
        align="center"
      />

      {/* Dial */}
      <Circle
        x={cx} y={cy + 12}
        radius={6}
        fill="#212121"
        stroke="#424242"
        strokeWidth={0.8}
      />
      <Line points={[cx, cy + 12, cx - 3, cy + 9]} stroke="#ef5350" strokeWidth={1.2} />
    </Group>
  )
}

// ── Switch Body ──
function SwitchBody({ cx, cy, w, h, theme, isHighlighted, x1, y1, x2, y2 }) {
  const bw = Math.max(w, 48)
  const bh = 18

  return (
    <Group>
      {/* Switch terminal connection leads */}
      <Line points={[x1, y1, cx - 12, cy]} stroke="#90a4ae" strokeWidth={1.5} lineCap="round" />
      <Line points={[x2, y2, cx + 12, cy]} stroke="#90a4ae" strokeWidth={1.5} lineCap="round" />

      {/* Metal casing (flat grey) */}
      <Rect
        x={cx - bw / 2} y={cy - bh / 2}
        width={bw} height={bh}
        fill="#cfd8dc"
        stroke={isHighlighted ? '#ef4444' : '#90a4ae'}
        strokeWidth={isHighlighted ? 2 : 1.2}
        cornerRadius={2}
      />

      {/* Slider slot */}
      <Rect
        x={cx - 10} y={cy - 3}
        width={20} height={6}
        fill="#374151"
        cornerRadius={1}
      />

      {/* Switch knob */}
      <Rect
        x={cx + 2} y={cy - 6}
        width={6} height={12}
        fill="#212121"
        stroke="#111"
        strokeWidth={0.5}
        cornerRadius={1}
      />
    </Group>
  )
}

// ── Generic Body ──
function GenericBody({ cx, cy, w, h, theme, type, isHighlighted, x1, y1, x2, y2 }) {
  const bw = Math.max(w, 48)
  const bh = Math.max(h, 24)

  return (
    <Group>
      {/* Silver pins connecting body to breadboard holes */}
      <Line points={[x1, y1, cx - bw / 2, y1]} stroke="#b0bec5" strokeWidth={2} lineCap="round" />
      <Line points={[x2, y2, cx + bw / 2, y2]} stroke="#b0bec5" strokeWidth={2} lineCap="round" />

      {/* Flat Black IC body */}
      <Rect
        x={cx - bw / 2} y={cy - bh / 2}
        width={bw} height={bh}
        fill="#212121"
        stroke={isHighlighted ? '#ef4444' : '#111111'}
        strokeWidth={isHighlighted ? 2 : 1.2}
        cornerRadius={1}
      />

      {/* Pin 1 indicator dot */}
      <Circle
        x={cx - bw / 2 + 5} y={cy - bh / 2 + 5}
        radius={1.2}
        fill="#374151"
      />

      {/* Notch */}
      <Arc
        x={cx - bw / 2} y={cy}
        innerRadius={0} outerRadius={3.5}
        angle={180} rotation={270}
        fill="#111111"
      />

      {/* Laser print label */}
      <Text
        x={cx - bw / 2 + 4} y={cy - 4}
        width={bw - 8}
        text={(type || '?').toUpperCase().slice(0, 8)}
        fontSize={8.5}
        fontFamily="Courier New, monospace"
        fontStyle="bold"
        fill="#cfd8dc"
        align="center"
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

  // Determine correct rail context based on which section the other end is in
  const fromContext = (bb.from_row === '+' || bb.from_row === '-')
    ? (TOP_ROWS.includes(bb.to_row) ? 'top' : 'bottom')
    : 'top'
  const toContext = (bb.to_row === '+' || bb.to_row === '-')
    ? (TOP_ROWS.includes(bb.from_row) ? 'top' : 'bottom')
    : 'top'

  const fromX = getColX(bb.from_col)
  const fromY = getRowY(bb.from_row, fromContext)
  const toX = getColX(bb.to_col)
  const toY = getRowY(bb.to_row, toContext)

  const color = resolveWireColor(connection.wire_color)

  // Simple controlled curve: midpoint with a small droop downward
  const midX = (fromX + toX) / 2
  const midY = (fromY + toY) / 2
  const dx = Math.abs(toX - fromX)
  const dy = Math.abs(toY - fromY)
  const dist = Math.sqrt(dx * dx + dy * dy)

  // Droop magnitude: proportional to distance but capped
  const droopMag = Math.min(dist * 0.15, 20) + (index % 3) * 4

  // For mostly-vertical cables (rail to row), offset horizontally with small droop
  // For mostly-horizontal cables (jumpers), offset vertically downward
  let ctrlX, ctrlY
  if (dy > dx) {
    // Vertical-ish cable: small horizontal offset, keep midpoint Y
    const dir = (index % 2 === 0) ? 1 : -1
    ctrlX = midX + dir * droopMag * 0.5
    ctrlY = midY
  } else {
    // Horizontal-ish cable: droop downward
    ctrlX = midX
    ctrlY = midY + droopMag
  }

  return (
    <Group>
      {/* Wire shadow */}
      <Path
        data={`M ${fromX} ${fromY} Q ${ctrlX + 1} ${ctrlY + 2} ${toX} ${toY}`}
        stroke="rgba(0,0,0,0.12)" strokeWidth={5.5}
        lineCap="round" lineJoin="round"
      />
      {/* Wire body */}
      <Path
        data={`M ${fromX} ${fromY} Q ${ctrlX} ${ctrlY} ${toX} ${toY}`}
        stroke={color} strokeWidth={4}
        lineCap="round" lineJoin="round"
      />
      {/* Wire highlight streak */}
      <Path
        data={`M ${fromX} ${fromY} Q ${ctrlX} ${ctrlY - 1} ${toX} ${toY}`}
        stroke="rgba(255,255,255,0.18)" strokeWidth={1.5}
        lineCap="round" lineJoin="round"
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
