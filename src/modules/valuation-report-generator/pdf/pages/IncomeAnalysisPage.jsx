import { Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { ReportFooter, ReportHeader } from '../components/Chrome'
import { Kpi, KpiRow } from '../components/Metrics'
import { COLORS, PAGE } from '../theme'
import { dash, isMissing, money, money2, number, percent, isReportedUnitRow } from '../../utils/formatters'

const s = StyleSheet.create({
  page: {
    backgroundColor: COLORS.cream,
    padding: PAGE.pad,
    paddingBottom: 36,
    fontFamily: 'Helvetica',
  },
  table: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, marginBottom: 10 },
  head: { backgroundColor: COLORS.navy, padding: 7 },
  headT: { color: COLORS.yellow, fontSize: 8, letterSpacing: 1 },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.line, paddingVertical: 4, paddingHorizontal: 6 },
  th: { fontSize: 7, color: COLORS.muted, fontFamily: 'Helvetica-Bold' },
  td: { fontSize: 8, color: COLORS.ink },
  c0: { width: '12%' },
  c: { width: '11%', textAlign: 'right' },
  bold: { fontFamily: 'Helvetica-Bold', color: COLORS.navy },
  note: { fontSize: 8, color: COLORS.muted, marginBottom: 6 },
})

function Cell({ children, header, bold, first }) {
  return <Text style={[header ? s.th : s.td, first ? s.c0 : s.c, bold ? s.bold : null]}>{children}</Text>
}

export default function IncomeAnalysisPage({ model, section = '02' }) {
  const rows = (model.incomeByUnitType || []).filter(isReportedUnitRow)
  const recent = model.recentIncome
  const cards = (recent?.rows || []).filter((row) => row.type !== 'Total' && !isMissing(row.currentAvgPcm))
  return (
    <Page size={PAGE.size} orientation={PAGE.orientation} style={s.page}>
      <ReportHeader section={`${section}  Income analysis`} title="Unit mix — current passing rent" />
      <View style={s.table}>
        <View style={s.head}>
          <Text style={s.headT}>INCOME ANALYSIS — OVERALL</Text>
        </View>
        <View style={s.tr}>
          <Cell header first>Type</Cell>
          <Cell header>Units</Cell>
          <Cell header>Sq ft</Cell>
          <Cell header>Let sq ft</Cell>
          <Cell header>£ pa</Cell>
          <Cell header>Min pcm</Cell>
          <Cell header>Max pcm</Cell>
          <Cell header>Avg pcm</Cell>
          <Cell header>£ psf</Cell>
        </View>
        {rows.map((row) => {
          const total = row.type === 'Total'
          return (
            <View key={String(row.type)} style={s.tr} wrap={false}>
              <Cell first bold={total}>{dash(row.type)}</Cell>
              <Cell bold={total}>{number(row.units)}</Cell>
              <Cell bold={total}>{number(row.areaSqFt)}</Cell>
              <Cell bold={total}>{number(row.letAreaSqFt)}</Cell>
              <Cell bold={total}>{money(row.incomePa)}</Cell>
              <Cell bold={total}>{money(row.minPcm)}</Cell>
              <Cell bold={total}>{money(row.maxPcm)}</Cell>
              <Cell bold={total}>{money(row.avgPcm)}</Cell>
              <Cell bold={total}>{money2(row.avgPsf)}</Cell>
            </View>
          )
        })}
      </View>
      {cards.length > 0 ? (
        <>
          <Text style={s.note}>
            {(recent.periodLabel || 'Recent lettings') + ' — current-period average versus the prior period, as stated in the workbook.'}
          </Text>
          <KpiRow>
            {cards.map((row) => (
              <Kpi
                key={row.type}
                label={row.type}
                value={money(row.currentAvgPcm)}
                sub={`Prior ${money(row.priorAvgPcm)}   ·   ${money2(row.variancePcm)}   ·   ${percent(row.variancePct, 1)}`}
              />
            ))}
          </KpiRow>
        </>
      ) : null}
      <ReportFooter model={model} />
    </Page>
  )
}
