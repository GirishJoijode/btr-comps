import { Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { ReportFooter, ReportHeader } from '../components/Chrome'
import { Kpi, KpiRow } from '../components/Metrics'
import { COLORS, PAGE } from '../theme'
import { dash, money, money2, number } from '../../utils/formatters'

const s = StyleSheet.create({
  page: {
    backgroundColor: COLORS.cream,
    padding: PAGE.pad,
    paddingBottom: 36,
    fontFamily: 'Helvetica',
  },
  table: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line },
  head: { backgroundColor: COLORS.navy, padding: 6 },
  headT: { color: COLORS.yellow, fontSize: 8, letterSpacing: 1 },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.line, paddingVertical: 4, paddingHorizontal: 4 },
  th: { fontSize: 6.5, color: COLORS.muted, fontFamily: 'Helvetica-Bold' },
  td: { fontSize: 7.5, color: COLORS.ink },
  bold: { fontFamily: 'Helvetica-Bold', color: COLORS.navy },
  name: { width: '16%' },
  op: { width: '16%' },
  num: { width: '9%', textAlign: 'right' },
  rent: { width: '8.33%', textAlign: 'right' },
})

function rentCell(value, psf) {
  if (value == null) return '—'
  return psf ? money2(value) : money(value)
}

const BED_FIELDS = [
  { type: 'Studio', rent: 'studio', psf: 'studioPsf', avgRent: 'studioRent', avgPsf: 'studioPsf' },
  { type: '1 Bed', rent: 'bed1', psf: 'bed1Psf' },
  { type: '2 Bed', rent: 'bed2', psf: 'bed2Psf' },
  { type: '3 Bed', rent: 'bed3', psf: 'bed3Psf' },
]

export default function RentalEvidencePage({ model, section = '03' }) {
  const bench = model.rentalBenchmarks || {}
  const schemes = (model.rentalEvidence || []).filter((row) => row && !row.isAverage && row.scheme)
  const bed = (type) => (bench.beds || []).find((row) => row.type === type)
  const columns = BED_FIELDS.filter((field) =>
    schemes.some((row) => row[field.rent] != null || row[field.psf] != null),
  )
  const average = {
    scheme: 'Average',
    operator: null,
    units: bench.averageUnits,
    launched: null,
    derived: true,
  }
  for (const field of columns) {
    if (field.type === 'Studio') {
      average[field.rent] = bench.studioRent
      average[field.psf] = bench.studioPsf
    } else {
      average[field.rent] = bed(field.type)?.comparableRent
      average[field.psf] = bed(field.type)?.comparablePsf
    }
  }
  const rows = schemes.length ? [...schemes, average] : []
  const rentWidth = `${50 / Math.max(columns.length * 2, 1)}%`
  const cards = [
    { label: 'Average units', value: number(bench.averageUnits, 0), sub: `${number(bench.schemeCount)} schemes`, dark: true },
    ...['1 Bed', '2 Bed', '3 Bed']
      .filter((type) => columns.some((field) => field.type === type))
      .map((type) => ({
        label: `Average ${type.toLowerCase()}`,
        value: money(bed(type)?.comparableRent),
        sub: `${money2(bed(type)?.comparablePsf)} per sq ft`,
      })),
  ]
  return (
    <Page size={PAGE.size} orientation={PAGE.orientation} style={s.page}>
      <ReportHeader section={`${section}  Rental evidence`} title="Comparable schemes" />
      <KpiRow>
        {cards.map((card) => (
          <Kpi key={card.label} dark={card.dark} label={card.label} value={card.value} sub={card.sub} />
        ))}
      </KpiRow>
      <View style={s.table}>
        <View style={s.head}>
          <Text style={s.headT}>RENTAL EVIDENCE</Text>
        </View>
        <View style={s.tr}>
          <Text style={[s.th, s.name]}>Scheme</Text>
          <Text style={[s.th, s.op]}>Operator</Text>
          <Text style={[s.th, s.num]}>Units</Text>
          <Text style={[s.th, s.num]}>Launch</Text>
          {columns.flatMap((field) => [
            <Text key={field.type} style={[s.th, s.rent, { width: rentWidth }]}>{field.type}</Text>,
            <Text key={`${field.type}-psf`} style={[s.th, s.rent, { width: rentWidth }]}>£psf</Text>,
          ])}
        </View>
        {rows.map((row) => (
          <View key={row.scheme} style={s.tr} wrap={false}>
            <Text style={[s.td, s.name, row.derived ? s.bold : null]}>{dash(row.scheme)}</Text>
            <Text style={[s.td, s.op]}>{dash(row.operator)}</Text>
            <Text style={[s.td, s.num]}>{number(row.units, 0)}</Text>
            <Text style={[s.td, s.num]}>{dash(row.launched)}</Text>
            {columns.flatMap((field) => [
              <Text key={field.rent} style={[s.td, s.rent, { width: rentWidth }]}>{rentCell(row[field.rent])}</Text>,
              <Text key={field.psf} style={[s.td, s.rent, { width: rentWidth }]}>{rentCell(row[field.psf], true)}</Text>,
            ])}
          </View>
        ))}
      </View>
      <ReportFooter model={model} />
    </Page>
  )
}
