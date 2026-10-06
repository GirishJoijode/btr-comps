import { Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { COLORS, PAGE } from '../theme'
import { dash } from '../../utils/formatters'

const s = StyleSheet.create({
  page: {
    backgroundColor: COLORS.cream,
    padding: 42,
    fontFamily: 'Helvetica',
  },
  kicker: { fontSize: 11, letterSpacing: 3, color: COLORS.navy, marginBottom: 8 },
  title: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: COLORS.navy, marginBottom: 6 },
  rule: { width: 72, height: 4, backgroundColor: COLORS.yellow, marginBottom: 22 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    paddingVertical: 12,
  },
  num: { width: 42, fontSize: 14, fontFamily: 'Helvetica-Bold', color: COLORS.navy },
  copy: { flex: 1 },
  name: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: COLORS.navy },
  blurb: { fontSize: 9, color: COLORS.muted, marginTop: 2 },
  foot: { position: 'absolute', left: 42, bottom: 28, fontSize: 8, color: COLORS.muted },
})

export default function ContentsPage({ model, outline }) {
  return (
    <Page size={PAGE.size} orientation={PAGE.orientation} style={s.page}>
      <Text style={s.kicker}>CONTENTS</Text>
      <Text style={s.title}>{dash(model.meta.propertyName)}</Text>
      <View style={s.rule} />
      {outline.map((item) => (
        <View key={item.key} style={s.row}>
          <Text style={s.num}>{item.number}</Text>
          <View style={s.copy}>
            <Text style={s.name}>{item.title}</Text>
            <Text style={s.blurb}>{item.blurb}</Text>
          </View>
        </View>
      ))}
      <Text style={s.foot}>{`${dash(model.meta.propertyName)}  |  VALUATION SUMMARY REPORT`}</Text>
    </Page>
  )
}
