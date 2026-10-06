import { Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { ReportFooter, ReportHeader } from '../components/Chrome'
import { Kpi, KpiRow } from '../components/Metrics'
import { COLORS, PAGE } from '../theme'
import { dash, isReportedUnitRow, money, money2, number, percent } from '../../utils/formatters'

const s = StyleSheet.create({
  page: {
    backgroundColor: COLORS.cream,
    padding: PAGE.pad,
    paddingBottom: 36,
    fontFamily: 'Helvetica',
  },
  split: { flexDirection: 'row', gap: 12 },
  panel: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line },
  left: { flex: 1.35 },
  right: { flex: 1 },
  head: { backgroundColor: COLORS.navy, padding: 7 },
  headT: { color: COLORS.yellow, fontSize: 8, letterSpacing: 1 },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.line, paddingVertical: 5, paddingHorizontal: 6 },
  th: { fontSize: 7, color: COLORS.muted, fontFamily: 'Helvetica-Bold' },
  td: { fontSize: 8, color: COLORS.ink },
  neg: { fontSize: 8, color: '#9B3A3A' },
  bold: { fontFamily: 'Helvetica-Bold', color: COLORS.navy },
  c0: { width: '18%' },
  c: { width: '16.4%', textAlign: 'right' },
  n0: { width: '58%' },
  n1: { width: '42%', textAlign: 'right' },
})

export default function MarketRentSummaryPage({ model, section = '03' }) {
  const rent = model.marketRent
  const types = (rent.unitTypes || []).filter(isReportedUnitRow)
  const residential = (rent.status || []).find((row) => row.label === 'Residential total')
  return (
    <Page size={PAGE.size} orientation={PAGE.orientation} style={s.page}>
      <ReportHeader section={`${section}  Market rent summary`} title="ERV assessment" />
      <KpiRow>
        <Kpi dark label="Gross ERV" value={money(rent.grossErv, { compact: true })} sub={`${money2(rent.grossErvPerSqFt)} per sq ft`} />
        <Kpi label="Gross reversion" value={percent(rent.reversion, 2)} sub={money(rent.reversionAmount, { compact: true })} />
        <Kpi label="Net ERV" value={money(rent.netErv, { compact: true })} sub="after lifecycle allowance" />
        <Kpi label="Leakage" value={percent(rent.leakage, 1)} sub="workbook ERV leakage" />
      </KpiRow>
      <View style={s.split}>
        <View style={[s.panel, s.left]}>
          <View style={s.head}>
            <Text style={s.headT}>GROSS MARKET RENT BY UNIT TYPE</Text>
          </View>
          <View style={s.tr}>
            <Text style={[s.th, s.c0]}>Type</Text>
            <Text style={[s.th, s.c]}>Units</Text>
            <Text style={[s.th, s.c]}>Passing pa</Text>
            <Text style={[s.th, s.c]}>Market pa</Text>
            <Text style={[s.th, s.c]}>Avg pcm</Text>
            <Text style={[s.th, s.c]}>Reversion</Text>
          </View>
          {types.map((row) => (
            <View key={String(row.type)} style={s.tr} wrap={false}>
              <Text style={[s.td, s.c0, row.type === 'Total' ? s.bold : null]}>{dash(row.type)}</Text>
              <Text style={[s.td, s.c]}>{number(row.units)}</Text>
              <Text style={[s.td, s.c]}>{money(row.passingPa)}</Text>
              <Text style={[s.td, s.c]}>{money(row.ervPa)}</Text>
              <Text style={[s.td, s.c]}>{money(row.ervPcm)}</Text>
              <Text style={[s.td, s.c]}>{percent(row.reversion, 1)}</Text>
            </View>
          ))}
          {residential ? (
            <View style={s.tr} wrap={false}>
              <Text style={[s.td, s.c0, s.bold]}>{residential.label}</Text>
              <Text style={[s.td, s.c, s.bold]}>{number(residential.units)}</Text>
              <Text style={[s.td, s.c, s.bold]}>{money(residential.passingPa)}</Text>
              <Text style={[s.td, s.c, s.bold]}>{money(residential.marketPa)}</Text>
              <Text style={[s.td, s.c, s.bold]}>{money(residential.marketPcm)}</Text>
              <Text style={[s.td, s.c, s.bold]}>{percent(residential.reversion, 1)}</Text>
            </View>
          ) : null}
        </View>
        <View style={[s.panel, s.right]}>
          <View style={s.head}>
            <Text style={s.headT}>NET MARKET RENT BRIDGE</Text>
          </View>
          {(rent.summaryBridge || []).map((row) => {
            const strong = row.kind === 'result' || row.kind === 'total'
            const negative = row.kind === 'deduction'
            return (
              <View key={row.name} style={s.tr} wrap={false}>
                <Text style={[s.td, s.n0, strong ? s.bold : null]}>{row.name}</Text>
                <Text style={[negative ? s.neg : s.td, s.n1, strong ? s.bold : null]}>
                  {negative ? `−${money(row.amount)}` : money(row.amount)}
                </Text>
              </View>
            )
          })}
          <View style={s.tr}>
            <Text style={[s.td, s.n0]}>Gross to net (ERV)</Text>
            <Text style={[s.td, s.n1]}>{percent(rent.grossToNet, 1)}</Text>
          </View>
        </View>
      </View>
      <ReportFooter model={model} />
    </Page>
  )
}
