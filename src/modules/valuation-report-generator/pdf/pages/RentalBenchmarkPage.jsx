import { Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import BenchmarkChart from '../components/BenchmarkChart'
import { ReportFooter, ReportHeader } from '../components/Chrome'
import { Kpi } from '../components/Metrics'
import { COLORS, PAGE } from '../theme'
import { isValidNumber, money, money2, variancePhrase } from '../../utils/formatters'
import { activeBenchmarkBeds } from '../outline'

const WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']

const s = StyleSheet.create({
  page: {
    backgroundColor: COLORS.cream,
    padding: PAGE.pad,
    paddingBottom: 36,
    fontFamily: 'Helvetica',
  },
  note: { fontSize: 8, color: COLORS.muted, marginBottom: 8 },
  split: { flexDirection: 'row', gap: 10 },
  cards: { width: 168, gap: 8 },
})

function countWord(n) {
  if (!n) return 'the'
  return WORDS[n - 1] || String(n)
}

export default function RentalBenchmarkPage({ model, metric = 'rent', section = '03' }) {
  const psf = metric === 'psf'
  const bench = model.rentalBenchmarks || { beds: [], schemeCount: 0 }
  const beds = activeBenchmarkBeds(model).filter((bed) =>
    psf
      ? isValidNumber(bed.subjectPsf) || isValidNumber(bed.comparablePsf)
      : isValidNumber(bed.subjectRent) || isValidNumber(bed.comparableRent),
  )
  const schemes = (model.rentalEvidence || []).filter((row) => row && !row.isAverage && row.scheme)
  const fieldFor = (bed) => {
    if (bed.type === '1 Bed') return psf ? 'bed1Psf' : 'bed1'
    if (bed.type === '2 Bed') return psf ? 'bed2Psf' : 'bed2'
    if (bed.type === '3 Bed') return psf ? 'bed3Psf' : 'bed3'
    return null
  }
  const subjectName = model.meta.propertyName || 'Subject'
  const groups = [
    {
      label: subjectName,
      subject: true,
      values: beds.map((bed) => (psf ? bed.subjectPsf : bed.subjectRent)),
    },
    ...schemes.map((row) => ({
      label: row.scheme,
      values: beds.map((bed) => row[fieldFor(bed)]),
    })),
    {
      label: 'Average',
      values: beds.map((bed) => (psf ? bed.comparablePsf : bed.comparableRent)),
    },
  ]
  if (!beds.length || !schemes.length) return null
  const place = model.meta.location ? `${model.meta.location} ` : ''
  const noun = bench.schemeCount === 1 ? 'scheme' : 'schemes'
  return (
    <Page size={PAGE.size} orientation={PAGE.orientation} style={s.page}>
      <ReportHeader
        section={`${section}  Rental benchmark`}
        title={psf ? '£ per sq ft versus comparables' : 'Monthly rent versus comparables'}
      />
      <Text style={s.note}>
        {`Subject market ${psf ? '£ per sq ft' : 'rent'} shown alongside the ${countWord(bench.schemeCount)} ${place}evidence ${noun}. Blank bedrooms stay blank and are left out of that average.`}
      </Text>
      <View style={s.split}>
        <BenchmarkChart groups={groups} labels={beds.map((bed) => bed.type)} psf={psf} width={560} height={320} />
        <View style={s.cards}>
          {beds.map((bed) => {
            const subject = psf ? bed.subjectPsf : bed.subjectRent
            const variance = psf ? bed.psfVariance : bed.rentVariance
            const comparable = psf ? bed.comparablePsf : bed.comparableRent
            return (
              <Kpi
                key={bed.type}
                dark={bed.type === beds[0]?.type}
                label={bed.type}
                value={psf ? money2(subject) : money(subject)}
                sub={isValidNumber(subject) && isValidNumber(comparable) ? variancePhrase(variance, psf ? 2 : 0) : null}
              />
            )
          })}
        </View>
      </View>
      <ReportFooter model={model} />
    </Page>
  )
}
