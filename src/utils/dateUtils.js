// -----------------------------------------------------------------------------
// Date / Date_Filter helpers
// -----------------------------------------------------------------------------
// In this dataset "Scheme + Date_Filter" is the effective unique record key:
// the same Scheme can appear once per reporting period (e.g. "Q2 2025",
// "Q3 2025", "2024"). These helpers parse Date_Filter into a comparable rank so
// we can determine the LATEST period, sort options latest-first, and pick the
// most recent entry per scheme for exports.
// -----------------------------------------------------------------------------
import { isBlank } from './formatters'

// Parse a "Q{n} {YYYY}" style value into a sortable rank, or null.
export function parseQuarter(value) {
  if (isBlank(value)) return null
  const m = String(value).match(/Q\s*([1-4])\s*[-/ ]?\s*(\d{4})/i)
  if (!m) return null
  const quarter = Number(m[1])
  const year = Number(m[2])
  return { year, quarter, rank: year * 4 + quarter, label: `Q${quarter} ${year}` }
}

// Convert any Date_Filter value into a single comparable number (higher = more
// recent). Returns null when the value can't be understood at all.
//
// Supported, roughly in priority order:
//   "Q3 2025" / "q3 2025" / "2025 Q3"   -> year*4 + quarter
//   "H1 2025" / "H2 2025"               -> year*4 + (1.5 | 3.5)
//   "2025"                              -> year*4 (bare year sorts below its quarters)
//   "dd/mm/yyyy"                        -> year*4 + month/3
//   ISO / Date-parseable string         -> year*4 + month/3
export function dateFilterRank(value) {
  if (isBlank(value)) return null
  const s = String(value).trim()

  const q = s.match(/Q\s*([1-4])\s*[-/ ]?\s*(\d{4})/i)
  if (q) return Number(q[2]) * 4 + Number(q[1])

  const qRev = s.match(/(\d{4})\s*[-/ ]?\s*Q\s*([1-4])/i)
  if (qRev) return Number(qRev[1]) * 4 + Number(qRev[2])

  const h = s.match(/H\s*([12])\s*[-/ ]?\s*(\d{4})/i)
  if (h) return Number(h[2]) * 4 + (Number(h[1]) === 1 ? 1.5 : 3.5)

  if (/^\d{4}$/.test(s)) return Number(s) * 4

  // dd/mm/yyyy (UK) — checked before Date() which would misread it.
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (dmy) return Number(dmy[3]) * 4 + (Number(dmy[2]) - 1) / 3

  const d = new Date(s)
  if (!Number.isNaN(d.getTime())) return d.getFullYear() * 4 + d.getMonth() / 3

  return null
}

// Comparator for Date_Filter values, latest first. Unknown values sort last,
// then alphabetically so the order is stable and never crashes.
export function compareDateFilterDesc(a, b) {
  const ra = dateFilterRank(a)
  const rb = dateFilterRank(b)
  if (ra === null && rb === null) return String(a).localeCompare(String(b), 'en', { numeric: true })
  if (ra === null) return 1
  if (rb === null) return -1
  if (rb !== ra) return rb - ra
  return String(a).localeCompare(String(b), 'en', { numeric: true })
}

// Sort a list of Date_Filter option strings, latest first.
export function sortDateFiltersDesc(values) {
  return [...values].sort(compareDateFilterDesc)
}

// Determine the latest quarter present in Date_Filter, or 'N/A'.
export function latestQuarterLabel(records) {
  let top = null
  for (const rec of records) {
    const q = parseQuarter(rec.Date_Filter)
    if (q && (!top || q.rank > top.rank)) top = q
  }
  return top ? top.label : 'N/A'
}

// Most recent "Last modified" date across records, or null.
export function latestModified(records) {
  let latest = null
  for (const rec of records) {
    const value = rec['Last modified']
    if (isBlank(value)) continue
    const d = new Date(value)
    if (!Number.isNaN(d.getTime()) && (!latest || d > latest)) latest = d
  }
  return latest
}

// Group key for a scheme. Schemes are keyed by name; blank scheme names fall
// back to a per-record key so they are never merged together.
function schemeGroupKey(rec, index) {
  return isBlank(rec.Scheme) ? `__row_${index}` : String(rec.Scheme).trim().toLowerCase()
}

// Reduce records to the most recent Date_Filter entry per Scheme. Used for the
// default export so a scheme that appears across several periods is exported
// once at its latest period. First-seen order is preserved.
export function latestPerScheme(records) {
  const best = new Map()
  records.forEach((rec, index) => {
    const key = schemeGroupKey(rec, index)
    const rank = dateFilterRank(rec.Date_Filter)
    const score = rank === null ? -Infinity : rank
    const existing = best.get(key)
    if (!existing || score > existing.score) best.set(key, { rec, score })
  })
  return Array.from(best.values()).map((b) => b.rec)
}

// All records for the same Scheme as `record`, sorted latest Date_Filter first.
// Powers the scheme detail modal's Date_Filter period toggle.
export function schemeDateEntries(records, record) {
  if (!record) return []
  const target = isBlank(record.Scheme) ? null : String(record.Scheme).trim().toLowerCase()
  if (target === null) return [record]
  return records
    .filter((r) => !isBlank(r.Scheme) && String(r.Scheme).trim().toLowerCase() === target)
    .sort((a, b) => compareDateFilterDesc(a.Date_Filter, b.Date_Filter))
}
