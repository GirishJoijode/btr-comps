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

export default function ExecutiveSummaryPage({ model }) {
  const { valuation, property, currentIncome, marketRent, meta } = model
  return (
    <Page size={PAGE.size} orientation={PAGE.orientation} style={s.page}>
      <ReportHeader section="01  Executive summary" title={dash(meta.propertyName)} />
      <View style={s.row}>
        <View style={s.hero}>
          <Text style={s.heroLabel}>Market value</Text>
          <Text style={s.heroValue}>{money(valuation.marketValue, { compact: true })}</Text>
          <Text style={s.heroSub}>{money2(valuation.valuePerSqFt)} per sq ft</Text>
        </View>
        <View style={s.kpi}>
          <Text style={s.kpiLabel}>Equivalent yield</Text>
          <Text style={s.kpiValue}>{percent(valuation.equivalentYield, 2)}</Text>
        </View>
        <View style={s.kpi}>
          <Text style={s.kpiLabel}>Reversionary yield (triple net)</Text>
          <Text style={s.kpiValue}>{percent(valuation.reversionaryYield, 2)}</Text>
        </View>
        <View style={s.kpi}>
          <Text style={s.kpiLabel}>Initial yield (triple net)</Text>
          <Text style={s.kpiValue}>{percent(valuation.netInitialYield, 2)}</Text>
        </View>
        <View style={s.kpi}>
          <Text style={s.kpiLabel}>IRR</Text>
          <Text style={s.kpiValue}>{percent(valuation.irr, 2)}</Text>
        </View>
      </View>
      <View style={s.grid}>
        <Cell label="Area" value={sqft(property.areaSqFt)} />
        <Cell label="Units" value={number(property.units)} />
        <Cell label="Occupancy" value={percent(currentIncome.occupancy, 1)} />
        <Cell label="Average unit size" value={sqft(property.averageUnitSize)} />
        <Cell label="Current net income" value={money(currentIncome.netIncome, { compact: true })} />
        <Cell label="Current gross income" value={money(currentIncome.grossIncome, { compact: true })} />
        <Cell label="Net market rent" value={money(marketRent.netErv, { compact: true })} />
        <Cell label="Gross ERV" value={money(marketRent.grossErv, { compact: true })} />
        <Cell label="Year built" value={dash(property.yearBuilt)} />
        <Cell label="Tenure" value={dash(property.tenure)} />
        <Cell label="Operator" value={dash(property.operator)} />
        <Cell label="Valuation date" value={dash(meta.valuationDate)} />
      </View>
      <ReportFooter model={model} page="2" />
    </Page>
  )
}
