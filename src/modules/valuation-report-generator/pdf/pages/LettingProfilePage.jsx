import { Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { ReportFooter, ReportHeader } from '../components/Chrome'
import { Kpi, KpiRow } from '../components/Metrics'
import { COLORS, PAGE } from '../theme'
import { dash, money, money2, number, percent } from '../../utils/formatters'

const s = StyleSheet.create({
  page: {
    backgroundColor: COLORS.cream,
    padding: PAGE.pad,
    paddingBottom: 36,
    fontFamily: 'Helvetica',
  },
  table: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line },
  head: { backgroundColor: COLORS.navy, padding: 8 },
  headT: { color: COLORS.yellow, fontSize: 8, letterSpacing: 1 },
  pair: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  k: { fontSize: 9, color: COLORS.ink, width: '62%' },
  v: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.navy, width: '38%', textAlign: 'right' },
})

function Pair({ label, value }) {
  if (value == null || value === '—' || value === '') return null
  return (
    <View style={s.pair}>
      <Text style={s.k}>{label}</Text>
      <Text style={s.v}>{value}</Text>
    </View>
  )
}

export default function LettingProfilePage({ model, section = '02' }) {
  const inc = model.currentIncome
  const letm = inc.lettingMetrics || {}
  return (
    <Page size={PAGE.size} orientation={PAGE.orientation} style={s.page}>
      <ReportHeader section={`${section}  Income summary`} title="Letting profile" />
      <KpiRow>
        <Kpi dark label="Occupancy" value={percent(inc.occupancy, 1)} sub={inc.occupiedUnits != null ? `${number(inc.occupiedUnits)} occupied units` : ' '} />
        <Kpi label="Lettings last 12 months" value={percent(letm.lettingsLast12Months, 1)} />
        <Kpi label="Average stay" value={number(letm.averageStayMonths, 1)} sub="months" />
      </KpiRow>
      <View style={s.table}>
        <View style={s.head}>
          <Text style={s.headT}>LETTING PROFILE</Text>
        </View>
        <Pair label="Date of valuation" value={dash(model.meta.valuationDate)} />
        <Pair label="Income" value={money(inc.grossIncome)} />
        <Pair label="Occupancy" value={percent(inc.occupancy, 1)} />
        <Pair label="ERV of vacant space" value={money(inc.ervVacantSpace)} />
        <Pair label="Lettings — last 12 months" value={percent(letm.lettingsLast12Months, 1)} />
        <Pair label="Average stay (months)" value={number(letm.averageStayMonths, 1)} />
        <Pair label="Income £ per sq ft (let space)" value={money2(letm.incomePsfOnLetSpace)} />
        <Pair label="Income growth (last 5 months)" value={percent(letm.incomeGrowthLast5Months, 1)} />
        <Pair label="Costs £ per unit" value={money2(letm.costsPerUnit)} />
        <Pair label="Costs % of income" value={percent(letm.costsPctOfIncome, 1)} />
        <Pair label="Costs as % of ERV" value={percent(letm.costsPctOfErv, 1)} />
      </View>
      <ReportFooter model={model} />
    </Page>
  )
}
