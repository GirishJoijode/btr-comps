import { Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { ReportFooter, ReportHeader } from '../components/Chrome'
import { COLORS, PAGE } from '../theme'
import { dash, money, money2, percent } from '../../utils/formatters'

const s = StyleSheet.create({
  page: {
    backgroundColor: COLORS.cream,
    padding: PAGE.pad,
    paddingBottom: 36,
    fontFamily: 'Helvetica',
  },
  kpis: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  kpi: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 12,
  },
  dark: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  label: { fontSize: 7, letterSpacing: 1, color: COLORS.muted, marginBottom: 6, textTransform: 'uppercase' },
  labelL: { fontSize: 7, letterSpacing: 1, color: COLORS.yellow, marginBottom: 6, textTransform: 'uppercase' },
  value: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: COLORS.navy },
  valueL: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: COLORS.white },
  sub: { fontSize: 8, color: COLORS.muted, marginTop: 4 },
  table: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line },
  head: { backgroundColor: COLORS.navy, padding: 8 },
  headT: { color: COLORS.yellow, fontSize: 8, letterSpacing: 1.2 },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.line, paddingVertical: 6, paddingHorizontal: 10 },
  th: { fontSize: 7, color: COLORS.muted, fontFamily: 'Helvetica-Bold' },
  td: { fontSize: 9, color: COLORS.ink },
  c0: { width: '28%' },
  c1: { width: '18%', textAlign: 'right' },
  c2: { width: '18%', textAlign: 'right' },
  c3: { width: '18%', textAlign: 'right' },
  c4: { width: '18%', textAlign: 'right' },
  total: { fontFamily: 'Helvetica-Bold', color: COLORS.navy },
})

function Kpi({ label, value, sub, dark }) {
  if (value == null || value === '—' || value === '') return null
  return (
    <View style={[s.kpi, dark ? s.dark : null]}>
      <Text style={dark ? s.labelL : s.label}>{label}</Text>
      <Text style={dark ? s.valueL : s.value}>{value}</Text>
      {sub && sub !== '—' ? <Text style={s.sub}>{sub}</Text> : null}
    </View>
  )
}

export default function OperatingCostsPage({ model, section = '02' }) {
  const costs = model.operatingCosts
  const cats = (costs.categories || []).filter(
    (row) => row.costPa != null || row.pctOfIncome != null || row.perSqFt != null || row.perUnit != null,
  )
  return (
    <Page size={PAGE.size} orientation={PAGE.orientation} style={s.page}>
      <ReportHeader section={`${section}  Operating costs`} title="Current running costs" />
      <View style={s.kpis}>
        <Kpi dark label="Total costs" value={money(costs.total, { compact: true })} />
        <Kpi label="Cost ratio" value={percent(costs.ratio, 1)} sub="of income net of bad debt" />
        <Kpi label="£ per flat" value={money2(costs.perUnit)} />
        <Kpi label="£ per sq ft" value={money2(costs.perSqFt)} />
      </View>
      <View style={s.table}>
        <View style={s.head}>
          <Text style={s.headT}>COST SUMMARY — CURRENT / PASSING</Text>
        </View>
        <View style={s.tr}>
          <Text style={[s.th, s.c0]}>Cost category</Text>
          <Text style={[s.th, s.c1]}>Cost pa</Text>
          <Text style={[s.th, s.c2]}>% of income</Text>
          <Text style={[s.th, s.c3]}>£ psf</Text>
          <Text style={[s.th, s.c4]}>£ per unit</Text>
        </View>
        {cats.map((c) => {
          const total = /^(total|sub[-\s]?total|net income)$/i.test(c.name)
          return (
            <View key={c.name} style={s.tr} wrap={false}>
              <Text style={[s.td, s.c0, total ? s.total : null]}>{dash(c.name)}</Text>
              <Text style={[s.td, s.c1, total ? s.total : null]}>{money(c.costPa)}</Text>
              <Text style={[s.td, s.c2, total ? s.total : null]}>{percent(c.pctOfIncome, 1)}</Text>
              <Text style={[s.td, s.c3, total ? s.total : null]}>{c.perSqFt != null ? money2(c.perSqFt) : '—'}</Text>
              <Text style={[s.td, s.c4, total ? s.total : null]}>{c.perUnit != null ? money2(c.perUnit) : '—'}</Text>
            </View>
          )
        })}
      </View>
      <ReportFooter model={model} />
    </Page>
  )
}
