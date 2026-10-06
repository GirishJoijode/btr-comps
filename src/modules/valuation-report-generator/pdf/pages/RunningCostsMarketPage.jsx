import { Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { ReportFooter, ReportHeader } from '../components/Chrome'
import { Kpi, KpiRow } from '../components/Metrics'
import { COLORS, PAGE } from '../theme'
import { dash, money, money2, percent } from '../../utils/formatters'

const s = StyleSheet.create({
  page: {
    backgroundColor: COLORS.cream,
    padding: PAGE.pad,
    paddingBottom: 34,
    fontFamily: 'Helvetica',
  },
  table: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line },
  head: { backgroundColor: COLORS.navy, padding: 6 },
  headT: { color: COLORS.yellow, fontSize: 8, letterSpacing: 0.8 },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.line, paddingVertical: 3, paddingHorizontal: 6 },
  th: { fontSize: 7, color: COLORS.muted, fontFamily: 'Helvetica-Bold' },
  td: { fontSize: 8, color: COLORS.ink },
  neg: { fontSize: 8, color: '#9B3A3A' },
  bold: { fontFamily: 'Helvetica-Bold', color: COLORS.navy },
  c0: { width: '42%' },
  c: { width: '14.5%', textAlign: 'right' },
})

const SKIP = /gross to net|^leakage/i

export default function RunningCostsMarketPage({ model, section = '03' }) {
  const rent = model.marketRent
  const voidRow = (rent.assessment || []).find((row) => /^void$/i.test(row.name))
  const rows = (rent.assessment || []).filter((row) => !SKIP.test(row.name))
  return (
    <Page size={PAGE.size} orientation={PAGE.orientation} style={s.page}>
      <ReportHeader section={`${section}  Market rent`} title="Running costs and net market rent" />
      <KpiRow>
        <Kpi dark label="Gross ERV" value={money(rent.grossErv, { compact: true })} />
        <Kpi label="Void allowance" value={money(voidRow?.amount)} sub={percent(voidRow?.pct, 2)} />
        <Kpi label="Net market rent" value={money(rent.netErv, { compact: true })} sub={`${money2(rent.assessment?.find((row) => /^net market rent$/i.test(row.name))?.perSqFt)} per sq ft`} />
        <Kpi label="Gross to net" value={percent(rent.grossToNet, 1)} sub="pre management fee and cap-ex" />
      </KpiRow>
      <View style={s.table}>
        <View style={s.head}>
          <Text style={s.headT}>GROSS ERV ASSESSMENT — MARKET RENT, NOT CURRENT COSTS</Text>
        </View>
        <View style={s.tr}>
          <Text style={[s.th, s.c0]}> </Text>
          <Text style={[s.th, s.c]}>£</Text>
          <Text style={[s.th, s.c]}>%</Text>
          <Text style={[s.th, s.c]}>£ per sq ft</Text>
          <Text style={[s.th, s.c]}>£ per unit</Text>
        </View>
        {rows.map((row) => {
          const strong = row.kind === 'subtotal' || row.kind === 'result' || row.kind === 'total'
          return (
            <View key={row.name} style={s.tr} wrap={false}>
              <Text style={[s.td, s.c0, strong ? s.bold : null]}>{dash(row.name)}</Text>
              <Text style={[s.td, s.c, strong ? s.bold : null]}>{money(row.amount)}</Text>
              <Text style={[s.td, s.c]}>{percent(row.pct, 1)}</Text>
              <Text style={[s.td, s.c]}>{money2(row.perSqFt)}</Text>
              <Text style={[s.td, s.c]}>{money(row.perUnit)}</Text>
            </View>
          )
        })}
      </View>
      <ReportFooter model={model} />
    </Page>
  )
}
