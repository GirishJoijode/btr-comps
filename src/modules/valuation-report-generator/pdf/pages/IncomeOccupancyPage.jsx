import { Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { ReportFooter, ReportHeader } from '../components/Chrome'
import { Kpi, KpiRow } from '../components/Metrics'
import { COLORS, PAGE } from '../theme'
import { money, money2, number, percent } from '../../utils/formatters'

const s = StyleSheet.create({
  page: {
    backgroundColor: COLORS.cream,
    padding: PAGE.pad,
    paddingBottom: 36,
    fontFamily: 'Helvetica',
  },
  split: { flexDirection: 'row', gap: 12 },
  panel: { flex: 1, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line },
  head: { backgroundColor: COLORS.navy, padding: 8 },
  headT: { color: COLORS.yellow, fontSize: 8, letterSpacing: 1 },
  pair: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  k: { fontSize: 8, color: COLORS.muted, width: '62%' },
  v: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.navy, width: '38%', textAlign: 'right' },
})

function Pair({ label, value }) {
  return (
    <View style={s.pair}>
      <Text style={s.k}>{label}</Text>
      <Text style={s.v}>{value}</Text>
    </View>
  )
}

export default function IncomeOccupancyPage({ model }) {
  const inc = model.currentIncome
  const letm = inc.lettingMetrics || {}
  return (
    <Page size={PAGE.size} orientation={PAGE.orientation} style={s.page}>
      <ReportHeader section="03  Income and occupancy" title="Current / passing income" />
      <KpiRow>
        <Kpi
          dark
          label="Current gross income"
          value={money(inc.grossIncome, { compact: true })}
          sub={`${money2(inc.grossPerSqFt)} per sq ft`}
        />
        <Kpi
          label="Current net income"
          value={money(inc.netIncome, { compact: true })}
          sub={`${money2(inc.perSqFt)} per sq ft`}
        />
        <Kpi
          label="Occupancy"
          value={percent(inc.occupancy, 1)}
          sub={inc.occupiedUnits != null ? `${number(inc.occupiedUnits)} occupied units` : ' '}
        />
        <Kpi label="Gross to net" value={percent(inc.grossToNet, 1)} sub="pre management fee and cap-ex" />
      </KpiRow>
      <View style={s.split}>
        <View style={s.panel}>
          <View style={s.head}>
            <Text style={s.headT}>CURRENT INCOME SUMMARY</Text>
          </View>
          <Pair label="Rental income" value={money(inc.rentalIncome)} />
          <Pair label="Ancillary income" value={money(inc.ancillaryIncome)} />
          <Pair label="Total income" value={money(inc.grossIncome)} />
          <Pair label="Bad debt" value={money(inc.badDebt)} />
          <Pair label="Total (net of bad debt)" value={money(inc.netOfBadDebt)} />
          <Pair label="Total costs" value={money(model.operatingCosts.total)} />
          <Pair label="Net income" value={money(inc.netIncome)} />
          <Pair label="Gross to net" value={percent(inc.grossToNet, 1)} />
          <Pair label="Valuation date" value={model.meta.valuationDate || '—'} />
        </View>
        <View style={s.panel}>
          <View style={s.head}>
            <Text style={s.headT}>LETTING PROFILE</Text>
          </View>
          <Pair label="Occupancy" value={percent(inc.occupancy, 1)} />
          <Pair label="ERV of vacant space" value={money(inc.ervVacantSpace)} />
          <Pair label="Lettings — last 12 months" value={percent(letm.lettingsLast12Months, 1)} />
          <Pair label="Average stay (months)" value={number(letm.averageStayMonths, 1)} />
          <Pair label="Income £ per sq ft (let space)" value={money2(letm.incomePsfOnLetSpace)} />
          <Pair label="Income growth (last 5 months)" value={percent(letm.incomeGrowthLast5Months, 1)} />
          <Pair label="Current costs £ per unit" value={money2(letm.costsPerUnit)} />
          <Pair label="Current costs % of income" value={percent(letm.costsPctOfIncome, 1)} />
          <Pair label="Current costs as % of ERV" value={percent(letm.costsPctOfErv, 1)} />
        </View>
      </View>
      <ReportFooter model={model} />
    </Page>
  )
}
