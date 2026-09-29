import { Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { ReportFooter } from './Chrome'
import { COLORS, PAGE } from '../theme'
import { dash } from '../../utils/formatters'

const s = StyleSheet.create({
  page: {
    backgroundColor: COLORS.navy,
    padding: 40,
    fontFamily: 'Helvetica',
    flexDirection: 'row',
  },
  copy: { flex: 1, paddingRight: 24 },
  bar: { width: 72, height: 8, backgroundColor: COLORS.yellow, marginBottom: 28 },
  kicker: { fontSize: 11, letterSpacing: 3, color: COLORS.yellow, marginBottom: 16 },
  title: { fontSize: 30, color: COLORS.white, fontFamily: 'Helvetica-Bold', lineHeight: 1.15, maxWidth: 420 },
  lede: { marginTop: 16, fontSize: 12, color: '#D7D9E4', maxWidth: 380, lineHeight: 1.4 },
  photoWrap: { width: 280, justifyContent: 'center' },
  photo: { width: 280, height: 210, objectFit: 'cover' },
  cap: { marginTop: 8, fontSize: 9, color: COLORS.yellow },
})

export default function SectionDividerPage({ model, kicker, title, lede, image }) {
  return (
    <Page size={PAGE.size} orientation={PAGE.orientation} style={s.page}>
      <View style={s.copy}>
        <View style={s.bar} />
        <Text style={s.kicker}>{kicker}</Text>
        <Text style={s.title}>{title}</Text>
        {lede ? <Text style={s.lede}>{lede}</Text> : null}
      </View>
      {image ? (
        <View style={s.photoWrap}>
          <Image src={image} style={s.photo} />
          <Text style={s.cap}>
            {dash(model.meta.propertyName)}
            {model.meta.location ? `, ${model.meta.location}` : ''}
          </Text>
        </View>
      ) : null}
      <ReportFooter model={model} tone="dark" />
    </Page>
  )
}
