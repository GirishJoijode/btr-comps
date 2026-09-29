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
  table: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, marginBottom: 10 },
  split: { flexDirection: 'row', gap: 12 },
  panel: { flex: 1, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line },
  head: { backgroundColor: COLORS.navy, padding: 6 },
  headT: { color: COLORS.yellow, fontSize: 7.5, letterSpacing: 0.8 },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.line, paddingVertical: 4, paddingHorizontal: 4 },
  th: { fontSize: 6.5, color: COLORS.muted, fontFamily: 'Helvetica-Bold' },
  td: { fontSize: 7.5, color: COLORS.ink },
  neg: { fontSize: 7.5, color: '#9B3A3A' },
  bold: { fontFamily: 'Helvetica-Bold', color: COLORS.navy },
  a: { width: '16%' },
  b: { width: '9.3%', textAlign: 'right' },
  n0: { width: '62%' },
  n1: { width: '38%', textAlign: 'right' },
  c0: { width: '34%' },
  c1: { width: '22%', textAlign: 'right' },
  c2: { width: '22%', textAlign: 'right' },
  c3: { width: '22%', textAlign: 'right' },
})

const COST_LINE = /staff|building|amenity|tenancy|marketing|mgt|budget capex/i

export default function MarketRentDetailPage({ model }) {
  const rent = model.marketRent
  const costs = (rent.assessment || []).filter((row) => COST_LINE.test(row.name))
  return (
    <Page size={PAGE.size} orientation={PAGE.orientation} style={s.page}>
      <ReportHeader section="07  Market rent" title="Passing rent and ERV" />
      <KpiRow>
        <Kpi dark label="Gross ERV" value={money(rent.grossErv, { compact: true })} />
        <Kpi label="Net market rent" value={money(rent.netErv, { compact: true })} />
        <Kpi label="ERV gross to net" value={percent(rent.grossToNet, 1)} sub="pre management fee and cap-ex" />
        <Kpi label="Leakage" value={percent(rent.leakage, 1)} sub={`Incl. voids ${percent(rent.leakageIncVoids, 1)}`} />
      </KpiRow>
      <View style={s.table}>
        <View style={s.head}>
          <Text style={s.headT}>MARKET RENT</Text>
        </View>
        <View style={s.tr}>
          <Text style={[s.th, s.a]}> </Text>
          <Text style={[s.th, s.b]}>Units</Text>
          <Text style={[s.th, s.b]}>Sq ft</Text>
          <Text style={[s.th, s.b]}>Passing pa</Text>
          <Text style={[s.th, s.b]}>Passing pcm</Text>
          <Text style={[s.th, s.b]}>Passing £psf</Text>
          <Text style={[s.th, s.b]}>Market pa</Text>
          <Text style={[s.th, s.b]}>Market pcm</Text>
          <Text style={[s.th, s.b]}>Market £psf</Text>
          <Text style={[s.th, s.b]}>Reversion</Text>
        </View>
        {(rent.status || []).map((row) => {
          const strong = row.label === 'Total' || row.label === 'Residential total'
          return (
            <View key={row.label} style={s.tr} wrap={false}>
              <Text style={[s.td, s.a, strong ? s.bold : null]}>{dash(row.label)}</Text>
              <Text style={[s.td, s.b]}>{number(row.units)}</Text>
              <Text style={[s.td, s.b]}>{number(row.areaSqFt)}</Text>
              <Text style={[s.td, s.b]}>{money(row.passingPa)}</Text>
              <Text style={[s.td, s.b]}>{money(row.passingPcm)}</Text>
              <Text style={[s.td, s.b]}>{money2(row.passingPsf)}</Text>
              <Text style={[s.td, s.b]}>{money(row.marketPa)}</Text>
              <Text style={[s.td, s.b]}>{money(row.marketPcm)}</Text>
              <Text style={[s.td, s.b]}>{money2(row.marketPsf)}</Text>
              <Text style={[s.td, s.b]}>{percent(row.reversion, 1)}</Text>
            </View>
          )
        })}
      </View>
      <View style={s.split}>
        <View style={s.panel}>
          <View style={s.head}>
            <Text style={s.headT}>ERV OPERATING COSTS</Text>
          </View>
          <View style={s.tr}>
            <Text style={[s.th, s.c0]}>Cost</Text>
            <Text style={[s.th, s.c1]}>£ pa</Text>
            <Text style={[s.th, s.c2]}>% of ERV</Text>
            <Text style={[s.th, s.c3]}>£ psf</Text>
          </View>
          {costs.map((row) => (
            <View key={row.name} style={s.tr} wrap={false}>
              <Text style={[s.td, s.c0]}>{dash(row.name)}</Text>
              <Text style={[s.neg, s.c1]}>{`−${money(row.amount)}`}</Text>
              <Text style={[s.td, s.c2]}>{percent(row.pct, 1)}</Text>
              <Text style={[s.td, s.c3]}>{money2(row.perSqFt)}</Text>
            </View>
          ))}
        </View>
        <View style={s.panel}>
          <View style={s.head}>
            <Text style={s.headT}>NET MARKET RENT</Text>
          </View>
          {(rent.detailBridge || []).map((row) => {
            const strong = row.kind === 'result' || row.kind === 'subtotal' || row.kind === 'total'
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
        </View>
      </View>
      <ReportFooter model={model} />
    </Page>
  )
}
