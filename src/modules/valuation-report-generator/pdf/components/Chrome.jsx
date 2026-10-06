import { StyleSheet, Text, View } from '@react-pdf/renderer'
import { COLORS } from '../theme'

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 3,
    borderBottomColor: COLORS.yellow,
    paddingBottom: 8,
    marginBottom: 14,
  },
  kicker: {
    fontSize: 8,
    letterSpacing: 1.4,
    color: COLORS.muted,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.navy,
    marginTop: 3,
  },
  brand: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.navy,
    letterSpacing: 2,
  },
  footer: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: COLORS.muted,
  },
})

export function ReportHeader({ section, title }) {
  return (
    <View style={s.header}>
      <View>
        <Text style={s.kicker}>{section}</Text>
        <Text style={s.title}>{title}</Text>
      </View>
    </View>
  )
}

export function ReportFooter({ model, tone = 'light', numbered = true }) {
  const color = tone === 'dark' ? '#C5C7D4' : COLORS.muted
  const name = model.meta.propertyName || 'Property'
  return (
    <View style={[s.footer, { color }]} fixed>
      <Text>{`${name}  |  VALUATION SUMMARY REPORT`}</Text>
      <Text>CONFIDENTIAL</Text>
      {numbered ? (
        <Text render={({ pageNumber }) => String(Math.max(1, pageNumber - 2))} />
      ) : (
        <Text> </Text>
      )}
    </View>
  )
}
