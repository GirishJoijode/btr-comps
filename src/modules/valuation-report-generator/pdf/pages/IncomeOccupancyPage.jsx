import { Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { ReportFooter, ReportHeader } from '../components/Chrome'
import { Kpi, KpiRow } from '../components/Metrics'
import { COLORS, PAGE } from '../theme'
import { money, money2, percent } from '../../utils/formatters'

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
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.line, paddingVertical: 5, paddingHorizontal: 10 },
  th: { fontSize: 7, color: COLORS.muted, fontFamily: 'Helvetica-Bold' },
  td: { fontSize: 9, color: COLORS.ink },
  bold: { fontFamily: 'Helvetica-Bold', color: COLORS.navy },
  c0: { width: '40%' },
  c: { width: '20%', textAlign: 'right' },
})

function amount(row) {
  if (row.ratio) return percent(row.amount, row.name === 'Occupancy' ? 1 : 1)
  return money(row.amount)
}

export default function IncomeOccupancyPage({ model, section = '02' }) {
  const inc = model.currentIncome
  const rows = inc.statement || []
  return (
    <Page size={PAGE.size} orientation={PAGE.orientation} style={s.page}>
      <ReportHeader section={`${section}  Income summary`} title="Current passing income" />
      <KpiRow>
        <Kpi dark label="Gross income" value={money(inc.grossIncome, { compact: true })} sub={`${money2(inc.grossPerSqFt)} per sq ft`} />
        <Kpi label="Net income" value={money(inc.netIncome, { compact: true })} sub={`${money2(inc.perSqFt)} per sq ft`} />
        <Kpi label="Average rent" value={money(inc.averageRentPcm)} sub="pcm, current passing" />
        <Kpi label="Gross to net" value={percent(inc.grossToNet, 1)} sub="pre management fee and cap-ex" />
      </KpiRow>
      <View style={s.table}>
        <View style={s.head}>
          <Text style={s.headT}>INCOME SUMMARY</Text>
        </View>
        <View style={s.tr}>
          <Text style={[s.th, s.c0]}> </Text>
          <Text style={[s.th, s.c]}>£</Text>
          <Text style={[s.th, s.c]}>£ per sq ft</Text>
          <Text style={[s.th, s.c]}>£ per flat</Text>
        </View>
        {rows.map((row) => {
          const strong = row.name === 'Total' || row.name === 'Net income'
          return (
            <View key={row.name} style={s.tr} wrap={false}>
              <Text style={[s.td, s.c0, strong ? s.bold : null]}>{row.name}</Text>
              <Text style={[s.td, s.c, strong ? s.bold : null]}>{amount(row)}</Text>
              <Text style={[s.td, s.c]}>{row.ratio ? '—' : money2(row.perSqFt)}</Text>
              <Text style={[s.td, s.c]}>{row.ratio ? '—' : money(row.perUnit)}</Text>
            </View>
          )
        })}
      </View>
      <ReportFooter model={model} />
    </Page>
  )
}
