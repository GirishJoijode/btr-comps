import { Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { ReportFooter, ReportHeader } from '../components/Chrome'
import { COLORS, PAGE } from '../theme'
import { dash, number } from '../../utils/formatters'

const s = StyleSheet.create({
  page: {
    backgroundColor: COLORS.cream,
    padding: PAGE.pad,
    paddingBottom: 36,
    fontFamily: 'Helvetica',
  },
  row: { flexDirection: 'row', gap: 12 },
  panel: { flex: 1, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line },
  head: { backgroundColor: COLORS.navy, padding: 8 },
  headT: { color: COLORS.yellow, fontSize: 8, letterSpacing: 1 },
  pair: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  k: { width: '46%', fontSize: 8, color: COLORS.muted },
  v: { width: '54%', fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.navy },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.line, paddingVertical: 4, paddingHorizontal: 8 },
  th: { fontSize: 7, color: COLORS.muted, fontFamily: 'Helvetica-Bold' },
  td: { fontSize: 8, color: COLORS.ink },
  c0: { width: '40%' },
  c: { width: '20%', textAlign: 'right' },
  photo: { width: '100%', height: 180, objectFit: 'cover' },
  cap: { padding: 8, fontSize: 8, color: COLORS.muted },
})

function Pair({ label, value }) {
  if (value == null || value === '—' || value === '') return null
  return (
    <View style={s.pair}>
      <Text style={s.k}>{label}</Text>
      <Text style={s.v}>{value}</Text>
    </View>
  )
}

export default function FurtherInformationPage({ model, section = '05' }) {
  const info = model.furtherInfo || {}
  const photo = model.images.additional?.[0] || null
  const rooms = info.accommodation || []
  return (
    <Page size={PAGE.size} orientation={PAGE.orientation} style={s.page}>
      <ReportHeader section={`${section}  Further information`} title="Property details" />
      <View style={s.row}>
        <View style={s.panel}>
          <View style={s.head}>
            <Text style={s.headT}>PROPERTY</Text>
          </View>
          <Pair label="Property" value={dash(model.meta.propertyName)} />
          <Pair label="Tenure" value={dash(model.property.tenure)} />
          <Pair label="Sub-sector" value={dash(model.meta.subSector)} />
          <Pair label="Operator" value={dash(model.property.operator)} />
          <Pair label="Location" value={dash(model.meta.location)} />
          {info.description ? <Pair label="Description" value={info.description} /> : null}
          {info.situation ? <Pair label="Situation" value={info.situation} /> : null}
          {(info.amenities || []).map((row) => (
            <Pair key={row.name} label={row.name} value={dash(row.value)} />
          ))}
          {(info.condition || []).map((row) => (
            <Pair key={row.name} label={row.name} value={dash(row.value)} />
          ))}
          {info.storeys != null ? <Pair label="Height (max storeys)" value={number(info.storeys)} /> : null}
          {info.carParking != null ? <Pair label="Car parking" value={number(info.carParking)} /> : null}
        </View>
        {rooms.length || photo ? (
          <View style={s.panel}>
            {rooms.length ? (
              <>
                <View style={s.head}>
                  <Text style={s.headT}>ACCOMMODATION</Text>
                </View>
                <View style={s.tr}>
                  <Text style={[s.th, s.c0]}> </Text>
                  <Text style={[s.th, s.c]}>Sq ft</Text>
                  <Text style={[s.th, s.c]}>Units</Text>
                  <Text style={[s.th, s.c]}>Average</Text>
                </View>
                {rooms.map((row) => (
                  <View key={row.name} style={s.tr}>
                    <Text style={[s.td, s.c0]}>{row.name}</Text>
                    <Text style={[s.td, s.c]}>{number(row.areaSqFt)}</Text>
                    <Text style={[s.td, s.c]}>{number(row.units)}</Text>
                    <Text style={[s.td, s.c]}>{row.average != null ? number(row.average, 0) : '—'}</Text>
                  </View>
                ))}
              </>
            ) : null}
            {photo ? (
              <View>
                <Image src={photo} style={s.photo} />
                <Text style={s.cap}>
                  {dash(model.meta.propertyName)}
                  {model.meta.location ? `, ${model.meta.location}` : ''}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
      <ReportFooter model={model} />
    </Page>
  )
}
