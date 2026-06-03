// -----------------------------------------------------------------------------
// Date / quarter helpers
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
