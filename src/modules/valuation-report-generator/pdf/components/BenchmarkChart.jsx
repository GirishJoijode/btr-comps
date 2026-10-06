import { Line, Rect, Svg, Text, View } from '@react-pdf/renderer'
import { COLORS } from '../theme'

const BED_COLORS = ['#25273A', '#7C82A0', '#D4A017', '#8A8F7A']

function axisMax(value) {
  if (!value || value <= 0) return 1
  const padded = value * 1.15
  const step = padded >= 1000 ? 500 : padded >= 100 ? 20 : padded >= 20 ? 5 : 1
  return Math.ceil(padded / step) * step
}

function formatTick(value, psf) {
  if (!Number.isFinite(value)) return ''
  if (psf) return `£${Math.round(value)}`
  if (value >= 1000) return `£${Math.round(value / 100) / 10}k`
  return `£${Math.round(value)}`
}

export default function BenchmarkChart({ groups, labels = [], psf = false, width = 760, height = 250 }) {
  const series = labels.length ? labels : ['1 Bed', '2 Bed', '3 Bed']
  const usable = (groups || []).filter((group) => (group.values || []).some((value) => typeof value === 'number' && Number.isFinite(value) && value > 0))
  if (!usable.length || !series.length) return null
  const left = 46
  const bottom = 28
  const top = 8
  const plotW = width - left - 8
  const plotH = height - bottom - top
  const maxVal = Math.max(
    1,
    ...usable.flatMap((group) => group.values.filter((v) => typeof v === 'number' && Number.isFinite(v) && v > 0))
  )
  const yMax = axisMax(maxVal)
  const groupW = plotW / Math.max(usable.length, 1)
  const barW = Math.min(16, (groupW - 18) / Math.max(series.length, 1))
  const yTicks = [0, yMax / 2, yMax]

  return (
    <View>
      <Svg width={width} height={height}>
        {yTicks.map((tick) => {
          const y = top + plotH - (tick / yMax) * plotH
          return (
            <Line
              key={tick}
              x1={left}
              y1={y}
              x2={left + plotW}
              y2={y}
              stroke={COLORS.line}
              strokeWidth={0.6}
            />
          )
        })}
        {usable.map((group, gi) => {
          const gx = left + gi * groupW
          return group.values.map((value, bi) => {
            if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null
            const h = (value / yMax) * plotH
            const x = gx + 8 + bi * (barW + 2)
            const y = top + plotH - h
            return <Rect key={`${gi}-${bi}`} x={x} y={y} width={barW} height={h} fill={BED_COLORS[bi % BED_COLORS.length]} />
          })
        })}
        {yTicks.map((tick) => {
          const y = top + plotH - (tick / yMax) * plotH + 3
          return (
            <Text key={`t-${tick}`} x={2} y={y} fill={COLORS.muted} style={{ fontSize: 7 }}>
              {formatTick(tick, psf)}
            </Text>
          )
        })}
        {usable.map((group, gi) => {
          const label = String(group.label || '').slice(0, usable.length > 6 ? 8 : 12)
          const x = left + gi * groupW + 6
          return (
            <Text
              key={`l-${gi}`}
              x={x}
              y={height - 8}
              fill={group.subject ? COLORS.navy : COLORS.muted}
              style={{ fontSize: 7 }}
            >
              {label}
            </Text>
          )
        })}
      </Svg>
      <View style={{ flexDirection: 'row', gap: 14, marginTop: 2 }}>
        {series.map((label, i) => (
          <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 8, height: 8, backgroundColor: BED_COLORS[i % BED_COLORS.length] }} />
            <Text style={{ fontSize: 8, color: COLORS.muted }}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
