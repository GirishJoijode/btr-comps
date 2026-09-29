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
  name: { width: '13%' },
  op: { width: '15%' },
  num: { width: '8%', textAlign: 'right' },
  rent: { width: '7%', textAlign: 'right' },
})

function rentCell(value, psf) {
  if (value == null) return '—'
  return psf ? money2(value) : money(value)
}

export default function RentalEvidencePage({ model }) {
  const bench = model.rentalBenchmarks || {}
  const schemes = (model.rentalEvidence || []).filter((row) => !row.isAverage)
  const bed = (type) => (bench.beds || []).find((row) => row.type === type)
  const average = {
    scheme: 'Average',
    operator: null,
    units: bench.averageUnits,
    launched: null,
    studio: bench.studioRent,
    studioPsf: bench.studioPsf,
    bed1: bed('1 Bed')?.comparableRent,
    bed1Psf: bed('1 Bed')?.comparablePsf,
    bed2: bed('2 Bed')?.comparableRent,
    bed2Psf: bed('2 Bed')?.comparablePsf,
    bed3: bed('3 Bed')?.comparableRent,
    bed3Psf: bed('3 Bed')?.comparablePsf,
    derived: true,
  }
  const rows = [...schemes, average]
  return (
    <Page size={PAGE.size} orientation={PAGE.orientation} style={s.page}>
      <ReportHeader section="08  Rental evidence" title="Comparable schemes" />
      <KpiRow>
        <Kpi dark label="Schemes" value={number(bench.schemeCount)} />
        <Kpi label="Average units" value={number(bench.averageUnits, 0)} />
        <Kpi label="Average 1 bed" value={money(bed('1 Bed')?.comparableRent)} sub="pcm, schemes with a 1 bed rent" />
        <Kpi label="Average 2 bed" value={money(bed('2 Bed')?.comparableRent)} sub="pcm" />
        <Kpi label="Average 3 bed" value={money(bed('3 Bed')?.comparableRent)} sub="pcm, blank 3 beds excluded" />
      </KpiRow>
      <View style={s.table}>
        <View style={s.head}>
          <Text style={s.headT}>RENTAL EVIDENCE</Text>
        </View>
        <View style={s.tr}>
          <Text style={[s.th, s.name]}>Scheme</Text>
          <Text style={[s.th, s.op]}>Operator</Text>
          <Text style={[s.th, s.num]}>Units</Text>
          <Text style={[s.th, s.num]}>Launched</Text>
          <Text style={[s.th, s.rent]}>Studio</Text>
          <Text style={[s.th, s.rent]}>£psf</Text>
          <Text style={[s.th, s.rent]}>1 Bed</Text>
          <Text style={[s.th, s.rent]}>£psf</Text>
          <Text style={[s.th, s.rent]}>2 Bed</Text>
          <Text style={[s.th, s.rent]}>£psf</Text>
          <Text style={[s.th, s.rent]}>3 Bed</Text>
          <Text style={[s.th, s.rent]}>£psf</Text>
        </View>
        {rows.map((row) => (
          <View key={row.scheme} style={s.tr} wrap={false}>
            <Text style={[s.td, s.name, row.derived ? s.bold : null]}>{dash(row.scheme)}</Text>
            <Text style={[s.td, s.op]}>{dash(row.operator)}</Text>
            <Text style={[s.td, s.num]}>{number(row.units, 0)}</Text>
            <Text style={[s.td, s.num]}>{dash(row.launched)}</Text>
            <Text style={[s.td, s.rent]}>{rentCell(row.studio)}</Text>
            <Text style={[s.td, s.rent]}>{rentCell(row.studioPsf, true)}</Text>
            <Text style={[s.td, s.rent]}>{rentCell(row.bed1)}</Text>
            <Text style={[s.td, s.rent]}>{rentCell(row.bed1Psf, true)}</Text>
            <Text style={[s.td, s.rent]}>{rentCell(row.bed2)}</Text>
            <Text style={[s.td, s.rent]}>{rentCell(row.bed2Psf, true)}</Text>
            <Text style={[s.td, s.rent]}>{rentCell(row.bed3)}</Text>
            <Text style={[s.td, s.rent]}>{rentCell(row.bed3Psf, true)}</Text>
          </View>
        ))}
      </View>
      <ReportFooter model={model} />
    </Page>
  )
}
