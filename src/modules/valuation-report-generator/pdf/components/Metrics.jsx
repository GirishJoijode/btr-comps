import { StyleSheet, Text, View } from '@react-pdf/renderer'
import { COLORS } from '../theme'

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  card: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 10,
    minHeight: 62,
  },
  dark: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  label: { fontSize: 7, letterSpacing: 0.8, color: COLORS.muted, marginBottom: 4, textTransform: 'uppercase' },
  labelDark: { fontSize: 7, letterSpacing: 0.8, color: COLORS.yellow, marginBottom: 4, textTransform: 'uppercase' },
  value: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: COLORS.navy },
  valueDark: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: COLORS.white },
  sub: { fontSize: 8, color: COLORS.muted, marginTop: 3 },
  subDark: { fontSize: 8, color: '#D7D9E4', marginTop: 3 },
  head: { backgroundColor: COLORS.navy, paddingVertical: 6, paddingHorizontal: 8 },
  headText: { color: COLORS.yellow, fontSize: 8, letterSpacing: 1 },
})

export function KpiRow({ children }) {
  return <View style={s.row}>{children}</View>
}

function shown(value) {
  if (value == null) return false
  const text = String(value).trim()
  return text !== '' && text !== '—' && text !== '-'
}

export function Kpi({ label, value, sub, dark }) {
  if (!shown(value)) return null
  return (
    <View style={[s.card, dark ? s.dark : null]}>
      <Text style={dark ? s.labelDark : s.label}>{label}</Text>
      <Text style={dark ? s.valueDark : s.value}>{value}</Text>
      {shown(sub) ? <Text style={dark ? s.subDark : s.sub}>{sub}</Text> : null}
    </View>
  )
}

export function TableTitle({ children }) {
  return (
    <View style={s.head}>
      <Text style={s.headText}>{children}</Text>
    </View>
  )
}
