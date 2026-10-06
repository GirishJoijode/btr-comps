import { Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { ReportFooter, ReportHeader } from '../components/Chrome'
import { COLORS, PAGE } from '../theme'
import { dash, isMissing, number, sqft } from '../../utils/formatters'

const s = StyleSheet.create({
  page: {
    backgroundColor: COLORS.cream,
    padding: PAGE.pad,
    paddingBottom: 36,
    fontFamily: 'Helvetica',
  },
  row: { flexDirection: 'row', gap: 16, minHeight: 420 },
  table: { flex: 1, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line },
  caption: {
    fontSize: 8,
    letterSpacing: 1.2,
    color: COLORS.yellow,
    padding: 10,
    backgroundColor: COLORS.navy,
  },
  tr: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  th: { width: '42%', fontSize: 9, color: COLORS.muted },
  td: { width: '58%', fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.navy },
  photoWrap: {
    width: 300,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    overflow: 'hidden',
  },
  photo: { width: '100%', height: 360, objectFit: 'cover' },
  photoCap: { padding: 10, fontSize: 9, color: COLORS.muted },
})

function Row({ label, value }) {
  return (
    <View style={s.tr}>
      <Text style={s.th}>{label}</Text>
      <Text style={s.td}>{value}</Text>
    </View>
  )
}

export default function PropertyOverviewPage({ model, section = '02', furtherSection = null }) {
  const { property, meta, images } = model
  const rows = [
    ['Property', meta.propertyName],
    ['Location', meta.location],
    ['Sub-sector', meta.subSector],
    ['Operator', property.operator],
    ['Units', number(property.units)],
    ['Area', sqft(property.areaSqFt)],
    ['Average unit size', sqft(property.averageUnitSize)],
    ['Year of construction', property.yearBuilt],
    ['Year of modernisation', property.yearModernised],
    ['Tenure', property.tenure],
    ['Affordable', property.affordable],
  ].filter(([, value]) => !isMissing(value) && value !== '—')
  const photo = images.propertyImage
  return (
    <Page size={PAGE.size} orientation={PAGE.orientation} style={s.page}>
      <ReportHeader section={`${section}  Property overview`} title="Asset profile" />
      <View style={s.row}>
        <View style={s.table}>
          <Text style={s.caption}>PROPERTY / ASSET PROFILE</Text>
          {rows.map(([label, value]) => (
            <Row key={label} label={label} value={dash(value)} />
          ))}
        </View>
        {photo ? (
          <View style={s.photoWrap}>
            <Image src={photo} style={s.photo} />
            <Text style={s.photoCap}>
              {dash(meta.propertyName)}
              {meta.location ? `, ${meta.location}` : ''}
              {furtherSection ? `  ·  Further detail in section ${furtherSection}` : ''}
            </Text>
          </View>
        ) : null}
      </View>
      <ReportFooter model={model} />
    </Page>
  )
}
