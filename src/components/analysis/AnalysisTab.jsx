import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CHART, TOOLTIP_STYLE } from '../../config/theme'
import {
  averageByGroupForField,
  countByDateFilter,
  occupancyByStabilisation,
  UNIT_DEFS,
} from '../../utils/analysis'
import { formatCurrency, formatCurrencyShort } from '../../utils/formatters'
import ChartCard from './ChartCard'

const TOP_N = 12 // cap busy "by town" charts so they stay readable
const ROW_HEIGHT = 26
const axisTick = { fontSize: 11, fill: CHART.axisText }
const catTick = { fontSize: 12, fill: CHART.categoryText }

const money = {
  axis: formatCurrencyShort,
  value: formatCurrency,
  label: 'Avg rent',
}
const psf = {
  axis: (v) => `£${v}`,
  value: (v) => `£${Number(v).toFixed(2)}`,
  label: 'Avg £ psf',
}
const percent = (v) => `${(Number(v) * 100).toFixed(1)}%`

// Horizontal bar chart (category on Y) — used for the town & region breakdowns.
function HorizontalBars({ data, fmt, scroll }) {
  const height = scroll ? Math.max(160, data.length * ROW_HEIGHT + 16) : '100%'

  const chart = (
    <ResponsiveContainer width="100%" height={scroll ? height : '100%'}>
      <BarChart layout="vertical" data={data} margin={{ top: 4, right: 64, bottom: 4, left: 6 }}>
        <CartesianGrid horizontal={false} stroke={CHART.grid} />
        <XAxis type="number" tickFormatter={fmt.axis} tick={axisTick} stroke={CHART.axis} />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={catTick}
          stroke={CHART.axis}
          interval={0}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255,223,0,0.10)' }}
          formatter={(v, _n, p) => [`${fmt.value(v)}  ·  ${p?.payload?.count ?? 0} recs`, fmt.label]}
          contentStyle={TOOLTIP_STYLE}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
          {data.map((d, i) => (
            <Cell key={d.name} fill={i === 0 ? CHART.accent : CHART.primaryMid} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            formatter={fmt.value}
            style={{ fontSize: 11, fill: CHART.axisText }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )

  return scroll ? (
    <div className="chart-scroll" style={{ height }}>
      {chart}
    </div>
  ) : (
    chart
  )
}

function UnitToggle({ value, onChange }) {
  return (
    <div className="segmented" role="tablist" aria-label="Unit type">
      {UNIT_DEFS.map((u) => (
        <button
          key={u.key}
          type="button"
          role="tab"
          aria-selected={value === u.key}
          className={`segmented__btn${value === u.key ? ' is-active' : ''}`}
          onClick={() => onChange(u.key)}
        >
          {u.label}
        </button>
      ))}
    </div>
  )
}

export default function AnalysisTab({ records, basisLabel }) {
  const [unit, setUnit] = useState('Bed1') // default to 1-bed (most populated)
  const unitDef = UNIT_DEFS.find((u) => u.key === unit) || UNIT_DEFS[0]

  const rentByTownAll = useMemo(
    () => averageByGroupForField(records, 'Town', unitDef.rent),
    [records, unitDef]
  )
  const psfByTownAll = useMemo(
    () => averageByGroupForField(records, 'Town', unitDef.psf, { round: 2 }),
    [records, unitDef]
  )
  const rentByRegion = useMemo(
    () => averageByGroupForField(records, 'Regional_Filter', unitDef.rent),
    [records, unitDef]
  )
  const psfByRegion = useMemo(
    () => averageByGroupForField(records, 'Regional_Filter', unitDef.psf, { round: 2 }),
    [records, unitDef]
  )
  const byDate = useMemo(() => countByDateFilter(records), [records])
  const occupancy = useMemo(() => occupancyByStabilisation(records), [records])

  const rentByTown = rentByTownAll.slice(0, TOP_N)
  const psfByTown = psfByTownAll.slice(0, TOP_N)

  const townRentSub =
    rentByTownAll.length > TOP_N
      ? `${unitDef.label} · £ pcm · top ${TOP_N} of ${rentByTownAll.length} towns`
      : `${unitDef.label} · £ pcm`
  const townPsfSub =
    psfByTownAll.length > TOP_N
      ? `${unitDef.label} · £ psf · top ${TOP_N} of ${psfByTownAll.length} towns`
      : `${unitDef.label} · £ psf`

  return (
    <div className="tab-panel analysis-panel">
      <div className="analysis-toolbar">
        <span className="analysis-toolbar__label">Unit type</span>
        <UnitToggle value={unit} onChange={setUnit} />
        {basisLabel && (
          <span
            className={`analysis-basis${
              basisLabel.includes('selected') ? ' analysis-basis--selected' : ''
            }`}
          >
            {basisLabel}
          </span>
        )}
      </div>

      <div className="analysis-grid">
        <ChartCard
          title="Average rent by town"
          subtitle={townRentSub}
          className="col-span-2"
          empty={rentByTown.length === 0}
        >
          <HorizontalBars data={rentByTown} fmt={money} scroll />
        </ChartCard>

        <ChartCard
          title="Average £ psf by town"
          subtitle={townPsfSub}
          className="col-span-2"
          empty={psfByTown.length === 0}
        >
          <HorizontalBars data={psfByTown} fmt={psf} scroll />
        </ChartCard>

        <ChartCard
          title="Records by date"
          subtitle="Count per Date filter (oldest → newest)"
          className="col-span-2"
          empty={byDate.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byDate} margin={{ top: 14, right: 12, bottom: 46, left: 4 }}>
              <CartesianGrid vertical={false} stroke={CHART.grid} />
              <XAxis
                dataKey="name"
                angle={-30}
                textAnchor="end"
                height={56}
                interval={0}
                tick={axisTick}
                stroke={CHART.axis}
              />
              <YAxis allowDecimals={false} tick={axisTick} stroke={CHART.axis} width={30} />
              <Tooltip
                cursor={{ fill: 'rgba(255,223,0,0.10)' }}
                formatter={(v) => [v, 'Records']}
                contentStyle={TOOLTIP_STYLE}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} fill={CHART.primary} maxBarSize={40}>
                <LabelList dataKey="value" position="top" style={{ fontSize: 11, fill: CHART.axisText }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Average rent by region"
          subtitle={`${unitDef.label} · £ pcm`}
          className="col-span-2"
          empty={rentByRegion.length === 0}
        >
          <HorizontalBars data={rentByRegion} fmt={money} />
        </ChartCard>

        <ChartCard
          title="Average £ psf by region"
          subtitle={`${unitDef.label} · £ psf`}
          className="col-span-2"
          empty={psfByRegion.length === 0}
        >
          <HorizontalBars data={psfByRegion} fmt={psf} />
        </ChartCard>

        <ChartCard
          title="Occupancy by stabilisation status"
          subtitle="Average occupancy · stabilised vs not"
          className="col-span-2"
          empty={occupancy.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={occupancy} margin={{ top: 16, right: 12, bottom: 8, left: 4 }}>
              <CartesianGrid vertical={false} stroke={CHART.grid} />
              <XAxis dataKey="name" tick={catTick} stroke={CHART.axis} interval={0} />
              <YAxis
                tickFormatter={percent}
                domain={[0, 1]}
                tick={axisTick}
                stroke={CHART.axis}
                width={44}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,223,0,0.10)' }}
                formatter={(v, _n, p) => [
                  `${percent(v)}  ·  ${p?.payload?.count ?? 0} schemes`,
                  'Avg occupancy',
                ]}
                contentStyle={TOOLTIP_STYLE}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={90}>
                {occupancy.map((d) => (
                  <Cell
                    key={d.name}
                    fill={d.name === 'Stabilised' ? CHART.accent : CHART.primaryMid}
                  />
                ))}
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={percent}
                  style={{ fontSize: 12, fill: CHART.categoryText, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}
