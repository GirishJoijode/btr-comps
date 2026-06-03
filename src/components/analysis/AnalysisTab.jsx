import { useMemo } from 'react'
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
  averagePsfByRegion,
  averagePsfByTown,
  averageRentByRegion,
  averageRentByTown,
  countByDateFilter,
} from '../../utils/analysis'
import { formatCurrency, formatCurrencyShort } from '../../utils/formatters'
import ChartCard from './ChartCard'

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

// Horizontal bar chart (category on Y) — used for town & region breakdowns.
// `scroll` makes the chart grow with the number of categories and scroll
// inside its card; otherwise it fills the card height.
function HorizontalBars({ data, fmt, scroll }) {
  const height = scroll ? Math.max(180, data.length * ROW_HEIGHT) : '100%'

  const chart = (
    <ResponsiveContainer width="100%" height={scroll ? height : '100%'}>
      <BarChart layout="vertical" data={data} margin={{ top: 4, right: 60, bottom: 4, left: 6 }}>
        <CartesianGrid horizontal={false} stroke={CHART.grid} />
        <XAxis type="number" tickFormatter={fmt.axis} tick={axisTick} stroke={CHART.axis} />
        <YAxis
          type="category"
          dataKey="name"
          width={118}
          tick={catTick}
          stroke={CHART.axis}
          interval={0}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255,223,0,0.10)' }}
          formatter={(v) => [fmt.value(v), fmt.label]}
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

export default function AnalysisTab({ records }) {
  const rentByTown = useMemo(() => averageRentByTown(records), [records])
  const psfByTown = useMemo(() => averagePsfByTown(records), [records])
  const rentByRegion = useMemo(() => averageRentByRegion(records), [records])
  const psfByRegion = useMemo(() => averagePsfByRegion(records), [records])
  const byDate = useMemo(() => countByDateFilter(records), [records])

  return (
    <div className="tab-panel analysis-panel">
      <div className="analysis-grid">
        <ChartCard
          title="Average rent by town"
          subtitle="Blended studio / 1 / 2 / 3-bed · £ pcm"
          className="col-span-3"
          empty={rentByTown.length === 0}
        >
          <HorizontalBars data={rentByTown} fmt={money} scroll />
        </ChartCard>

        <ChartCard
          title="Average £ psf by town"
          subtitle="Blended studio / 1 / 2 / 3-bed · £ psf"
          className="col-span-3"
          empty={psfByTown.length === 0}
        >
          <HorizontalBars data={psfByTown} fmt={psf} scroll />
        </ChartCard>

        <ChartCard
          title="Average rent by region"
          subtitle="£ pcm"
          className="col-span-2"
          empty={rentByRegion.length === 0}
        >
          <HorizontalBars data={rentByRegion} fmt={money} />
        </ChartCard>

        <ChartCard
          title="Average £ psf by region"
          subtitle="£ psf"
          className="col-span-2"
          empty={psfByRegion.length === 0}
        >
          <HorizontalBars data={psfByRegion} fmt={psf} />
        </ChartCard>

        <ChartCard
          title="Records by date"
          subtitle="Count per Date filter"
          className="col-span-2"
          empty={byDate.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byDate} margin={{ top: 12, right: 12, bottom: 44, left: 4 }}>
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
              <Bar dataKey="value" radius={[4, 4, 0, 0]} fill={CHART.primary} maxBarSize={44}>
                <LabelList dataKey="value" position="top" style={{ fontSize: 11, fill: CHART.axisText }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}
