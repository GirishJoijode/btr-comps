import { Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { ReportFooter, ReportHeader } from '../components/Chrome'
import { COLORS, PAGE } from '../theme'
import { dash, number, sqft } from '../../utils/formatters'

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
  missing: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEEDF3',
  },
})

function Row({ label, value }) {
  return (
    <View style={s.tr}>
      <Text style={s.th}>{label}</Text>
      <Text style={s.td}>{value}</Text>
    </View>
  )
}

export default function PropertyOverviewPage({ model }) {
  const { property, meta, images } = model
  return (
    <Page size={PAGE.size} orientation={PAGE.orientation} style={s.page}>
      <ReportHeader section="02  Property overview" title="Asset profile" />
      <View style={s.row}>
        <View style={s.table}>
          <Text style={s.caption}>PROPERTY / ASSET PROFILE</Text>
          <Row label="Property" value={dash(meta.propertyName)} />
          <Row label="Location" value={dash(meta.location)} />
          <Row label="Sub-sector" value={dash(meta.subSector)} />
          <Row label="Operator" value={dash(property.operator)} />
          <Row label="Units" value={number(property.units)} />
          <Row label="Area" value={sqft(property.areaSqFt)} />
          <Row label="Average unit size" value={sqft(property.averageUnitSize)} />
          <Row label="Year of construction" value={dash(property.yearBuilt)} />
          <Row label="Year of modernisation" value={dash(property.yearModernised)} />
          <Row label="Tenure" value={dash(property.tenure)} />
          <Row label="Affordable" value={dash(property.affordable)} />
        </View>
        <View style={s.photoWrap}>
          {images.propertyImage ? (
            <Image src={images.propertyImage} style={s.photo} />
          ) : (
            <View style={s.missing}>
              <Text style={{ fontSize: 9, color: COLORS.muted }}>No photograph in workbook</Text>
            </View>
          )}
          <Text style={s.photoCap}>
            {dash(meta.propertyName)}
            {meta.location ? `, ${meta.location}` : ''}
          </Text>
        </View>
      </View>
      <ReportFooter model={model} page="3" />
    </Page>
  )
}
