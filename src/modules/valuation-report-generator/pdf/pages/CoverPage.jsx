import { Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { COLORS, PAGE } from '../theme'
import { dash } from '../../utils/formatters'

const s = StyleSheet.create({
  page: {
    backgroundColor: COLORS.navy,
    padding: 40,
    fontFamily: 'Helvetica',
  },
  bar: {
    width: 72,
    height: 8,
    backgroundColor: COLORS.yellow,
    marginBottom: 28,
  },
  kicker: {
    fontSize: 11,
    letterSpacing: 4,
    color: COLORS.yellow,
    marginBottom: 18,
  },
  title: {
    fontSize: 32,
    color: COLORS.white,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.15,
    maxWidth: 520,
  },
  meta: {
    marginTop: 36,
    gap: 8,
  },
  line: {
    fontSize: 13,
    color: COLORS.white,
  },
  muted: {
    fontSize: 11,
    color: '#C5C7D4',
    marginTop: 6,
  },
  footer: {
    position: 'absolute',
    left: 40,
    right: 40,
    bottom: 28,
    fontSize: 9,
    letterSpacing: 2,
    color: COLORS.yellow,
  },
})

export default function CoverPage({ model }) {
  const { meta } = model
  return (
    <Page size={PAGE.size} orientation={PAGE.orientation} style={s.page}>
      <View style={s.bar} />
      <Text style={s.kicker}>VALUATION SUMMARY REPORT</Text>
      <Text style={s.title}>{dash(meta.propertyName)}</Text>
      <View style={s.meta}>
        <Text style={s.line}>
          {[meta.location, meta.subSector].filter(Boolean).join('  |  ') || '—'}
        </Text>
        <Text style={s.muted}>Valuation date  {dash(meta.valuationDate)}</Text>
      </View>
      <Text style={s.footer}>BTR VALUATION SUMMARY REPORT</Text>
    </Page>
  )
}
