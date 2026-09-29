import { Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import BenchmarkChart from '../components/BenchmarkChart'
import { ReportFooter, ReportHeader } from '../components/Chrome'
import { Kpi, KpiRow } from '../components/Metrics'
import { COLORS, PAGE } from '../theme'
import { money, money2, variancePhrase } from '../../utils/formatters'

const s = StyleSheet.create({
  page: {
    backgroundColor: COLORS.cream,
    padding: PAGE.pad,
    paddingBottom: 36,
    fontFamily: 'Helvetica',
  },
  note: { fontSize: 8, color: COLORS.muted, marginBottom: 6 },
})

export default function RentalBenchmarkPage({ model, metric = 'rent' }) {
  const psf = metric === 'psf'
  const bench = model.rentalBenchmarks || { beds: [] }
  const schemes = (model.rentalEvidence || []).filter((row) => !row.isAverage)
  const groups = [
    ...schemes.map((row) => ({
      label: row.scheme,
      values: psf ? [row.bed1Psf, row.bed2Psf, row.bed3Psf] : [row.bed1, row.bed2, row.bed3],
    })),
    {
      label: 'Subject',
      subject: true,
      values: (bench.beds || []).map((bed) => (psf ? bed.subjectPsf : bed.subjectRent)),
    },
  ]
  return (
    <Page size={PAGE.size} orientation={PAGE.orientation} style={s.page}>
      <ReportHeader
        section={psf ? '10  Rental benchmark' : '09  Rental benchmark'}
        title={psf ? '£ per sq ft versus comparables' : 'Monthly rent versus comparables'}
      />
      <Text style={s.note}>
        Subject bars are the workbook market rent (ERV) for this property. Comparable bars use only the matching bedroom column. A blank bedroom is omitted from that scheme and from the average.
      </Text>
      <KpiRow>
        {(bench.beds || []).map((bed) => (
          <Kpi
            key={bed.type}
            dark={bed.type === '1 Bed'}
            label={bed.type}
            value={psf ? money2(bed.subjectPsf) : money(bed.subjectRent)}
            sub={`Average ${psf ? money2(bed.comparablePsf) : money(bed.comparableRent)}  ·  ${variancePhrase(psf ? bed.psfVariance : bed.rentVariance, 2)}`}
          />
        ))}
      </KpiRow>
      <BenchmarkChart groups={groups} psf={psf} />
      <ReportFooter model={model} />
    </Page>
  )
}
