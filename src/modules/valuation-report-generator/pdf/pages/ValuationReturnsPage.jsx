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
  table: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, marginTop: 4 },
  head: { backgroundColor: COLORS.navy, padding: 8 },
  headT: { color: COLORS.yellow, fontSize: 8, letterSpacing: 1 },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.line, paddingVertical: 8, paddingHorizontal: 10 },
  th: { fontSize: 8, color: COLORS.muted, fontFamily: 'Helvetica-Bold' },
  td: { fontSize: 10, color: COLORS.ink },
  c0: { width: '40%' },
  c: { width: '30%', textAlign: 'right' },
  note: { marginTop: 8, fontSize: 8, color: COLORS.muted },
})

export default function ValuationReturnsPage({ model, section = '04' }) {
  const v = model.valuation
  const profile = model.yieldProfile || []
  const initial = profile.find((row) => row.measure === 'Initial')
  return (
    <Page size={PAGE.size} orientation={PAGE.orientation} style={s.page}>
      <ReportHeader section={`${section}  Investment value`} title="Valuation and returns" />
      <KpiRow>
        <Kpi dark label="Market value" value={money(v.marketValue, { compact: true })} sub={`${money2(v.valuePerSqFt)} per sq ft`} />
        <Kpi label="Initial yield" value={percent(v.netInitialYield, 2)} sub={`Net operating ${percent(initial?.netOperating, 2)}`} />
        <Kpi label="Equivalent yield" value={percent(v.equivalentYield, 2)} sub="true equivalent" />
        <Kpi label="IRR" value={percent(v.irr, 2)} sub="current cash flow" />
      </KpiRow>
      <View style={s.table}>
        <View style={s.head}>
          <Text style={s.headT}>YIELD PROFILE — CURRENT SCENARIO</Text>
        </View>
        <View style={s.tr}>
          <Text style={[s.th, s.c0]}>Measure</Text>
          <Text style={[s.th, s.c]}>Net operating</Text>
          <Text style={[s.th, s.c]}>Triple net</Text>
        </View>
        {profile.filter((row) => row.netOperating != null || row.tripleNet != null).map((row) => (
          <View key={row.measure} style={s.tr}>
            <Text style={[s.td, s.c0]}>{row.measure}</Text>
            <Text style={[s.td, s.c]}>{percent(row.netOperating, 2)}</Text>
            <Text style={[s.td, s.c]}>{percent(row.tripleNet, 2)}</Text>
          </View>
        ))}
      </View>
      <ReportFooter model={model} />
    </Page>
  )
}
