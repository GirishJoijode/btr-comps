import { Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { ReportFooter, ReportHeader } from '../components/Chrome'
import { Kpi, KpiRow } from '../components/Metrics'
import { COLORS, PAGE } from '../theme'
import { millions, money, percent } from '../../utils/formatters'

const s = StyleSheet.create({
  page: {
    backgroundColor: COLORS.cream,
    padding: PAGE.pad,
    paddingBottom: 36,
    fontFamily: 'Helvetica',
  },
  table: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line },
  head: { backgroundColor: COLORS.navy, padding: 6 },
  headT: { color: COLORS.yellow, fontSize: 8, letterSpacing: 0.8 },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.line, paddingVertical: 4, paddingHorizontal: 4 },
  th: { fontSize: 6.5, color: COLORS.muted, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  td: { fontSize: 7, color: COLORS.ink, textAlign: 'right' },
  label: { width: '16%', textAlign: 'left', fontSize: 7, color: COLORS.ink },
  col: { width: '7.63%' },
  note: { marginTop: 6, fontSize: 8, color: COLORS.muted },
})

function yearList(years) {
  if (!years?.length) return null
  if (years.length === 1) return `year ${years[0]}`
  if (years.length === 2) return `years ${years[0]} and ${years[1]}`
  return `years ${years.slice(0, -1).join(', ')} and ${years[years.length - 1]}`
}

export default function CashflowPage({ model, section = '04' }) {
  const flow = model.cashflow || { labels: [], series: [] }
  const capexNote = yearList(flow.capexYears)
  return (
    <Page size={PAGE.size} orientation={PAGE.orientation} style={s.page}>
      <ReportHeader section={`${section}  Investment value`} title="Ten-year cash flow" />
      <KpiRow>
        <Kpi dark label="IRR" value={percent(model.valuation.irr, 2)} sub="workbook cash flow" />
        <Kpi label="Year 10 net income" value={money(flow.year10NetIncome, { compact: true })} sub="workbook year 10" />
        <Kpi label="Exit value" value={money(flow.exitValue, { compact: true })} sub="workbook year 10" />
      </KpiRow>
      <View style={s.table}>
        <View style={s.head}>
          <Text style={s.headT}>£ MILLION — MAPPED FROM THE VALUATION CASH FLOW</Text>
        </View>
        <View style={s.tr}>
          <Text style={[s.th, s.label]}> </Text>
          {(flow.labels || []).map((label, index) => (
            <Text key={`${label}-${index}`} style={[s.th, s.col]}>{label === 'Day 1' ? 'Day 1' : label}</Text>
          ))}
        </View>
        {(flow.series || []).map((row) => (
          <View key={row.key} style={s.tr} wrap={false}>
            <Text style={s.label}>{row.label}</Text>
            {row.values.map((value, index) => (
              <Text key={index} style={[s.td, s.col]}>{millions(value)}</Text>
            ))}
          </View>
        ))}
      </View>
      {capexNote ? (
        <Text style={s.note}>{`Major capital expenditure is shown in ${capexNote}.`}</Text>
      ) : null}
      <ReportFooter model={model} />
    </Page>
  )
}
