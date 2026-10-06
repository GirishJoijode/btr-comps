import { Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { ReportFooter, ReportHeader } from '../components/Chrome'
import { COLORS, PAGE } from '../theme'
import { dash, money, money2, number, percent, sqft } from '../../utils/formatters'

const s = StyleSheet.create({
  page: {
    backgroundColor: COLORS.cream,
    padding: PAGE.pad,
    paddingBottom: 36,
    fontFamily: 'Helvetica',
  },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  hero: {
    flex: 1.2,
    backgroundColor: COLORS.navy,
    padding: 16,
    minHeight: 118,
  },
  heroLabel: {
    fontSize: 8,
    letterSpacing: 1.5,
    color: COLORS.yellow,
    marginBottom: 8,
  },
  heroValue: {
    fontSize: 26,
    color: COLORS.white,
    fontFamily: 'Helvetica-Bold',
  },
  heroSub: { fontSize: 10, color: '#D7D9E4', marginTop: 6 },
  kpi: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 12,
  },
  kpiLabel: {
    fontSize: 7,
    letterSpacing: 1,
    color: COLORS.muted,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.navy,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.white,
  },
  cell: {
    width: '25%',
    padding: 10,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.line,
  },
  cellLabel: { fontSize: 7, color: COLORS.muted, marginBottom: 4, textTransform: 'uppercase' },
  cellValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: COLORS.navy },
})

function Cell({ label, value }) {
  return (
    <View style={s.cell}>
      <Text style={s.cellLabel}>{label}</Text>
      <Text style={s.cellValue}>{value}</Text>
    </View>
  )
}

function present(value) {
  return value && value !== '—'
}

export default function ExecutiveSummaryPage({ model }) {
  const { valuation, property, currentIncome, marketRent, meta } = model
  const yields = [
    ['Equivalent yield', percent(valuation.equivalentYield, 2)],
    ['Reversionary yield (triple net)', percent(valuation.reversionaryYield, 2)],
    ['Initial yield (triple net)', percent(valuation.netInitialYield, 2)],
    ['IRR', percent(valuation.irr, 2)],
  ].filter(([, value]) => present(value))
  const cells = [
    ['Area', sqft(property.areaSqFt)],
    ['Units', number(property.units)],
    ['Occupancy', percent(currentIncome.occupancy, 1)],
    ['Average unit size', sqft(property.averageUnitSize)],
    ['Current net income', money(currentIncome.netIncome, { compact: true })],
    ['Current gross income', money(currentIncome.grossIncome, { compact: true })],
    ['Net ERV', money(marketRent.netErv, { compact: true })],
    ['Gross ERV', money(marketRent.grossErv, { compact: true })],
    ['Year built', dash(property.yearBuilt)],
    ['Tenure', dash(property.tenure)],
    ['Operator', dash(property.operator)],
    ['Valuation date', dash(meta.valuationDate)],
  ].filter(([, value]) => present(value))
  return (
    <Page size={PAGE.size} orientation={PAGE.orientation} style={s.page}>
      <ReportHeader section="01  Executive summary" title={dash(meta.propertyName)} />
      <View style={s.row}>
        <View style={s.hero}>
          <Text style={s.heroLabel}>Market value</Text>
          <Text style={s.heroValue}>{money(valuation.marketValue, { compact: true })}</Text>
          {present(money2(valuation.valuePerSqFt)) ? (
            <Text style={s.heroSub}>{money2(valuation.valuePerSqFt)} per sq ft</Text>
          ) : null}
        </View>
        {yields.map(([label, value]) => (
          <View key={label} style={s.kpi}>
            <Text style={s.kpiLabel}>{label}</Text>
            <Text style={s.kpiValue}>{value}</Text>
          </View>
        ))}
      </View>
      <View style={s.grid}>
        {cells.map(([label, value]) => (
          <Cell key={label} label={label} value={value} />
        ))}
      </View>
      <ReportFooter model={model} />
    </Page>
  )
}
