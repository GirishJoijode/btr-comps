// -----------------------------------------------------------------------------
// Analysis / aggregation logic (summary KPIs + chart datasets)
// -----------------------------------------------------------------------------
// Chart configuration (which charts appear) lives in
// src/components/analysis/AnalysisTab.jsx; the pure aggregation maths lives here.
// -----------------------------------------------------------------------------
import { isBlank } from './formatters'
import { dateFilterRank, latestModified, latestQuarterLabel } from './dateUtils'

// Unit types shown individually across the rent / psf charts.
export const UNIT_DEFS = [
  { key: 'Studio', label: 'Studio', rent: 'Studio_Rent', psf: 'Studio_psf' },
  { key: 'Bed1', label: '1 Bed', rent: 'Bed1_Rent', psf: 'Bed1_psf' },
  { key: 'Bed2', label: '2 Bed', rent: 'Bed2_Rent', psf: 'Bed2_psf' },
  { key: 'Bed3', label: '3 Bed', rent: 'Bed3_Rent', psf: 'Bed3_psf' },
]

// Summary statistics shown in the dashboard KPI cards.
export function buildSummary(records) {
  const schemes = new Set()
  for (const rec of records) {
    if (!isBlank(rec.Scheme)) schemes.add(String(rec.Scheme).trim())
  }
  return {
    total: records.length,
    schemes: schemes.size,
    currentQuarter: latestQuarterLabel(records),
    lastModified: latestModified(records),
  }
}

// Average of a SINGLE value field, grouped by `groupField`. Blank/zero values
// are ignored so a missing unit type for one record never drags down the
// average for the unit types that do have data. Returns
// [{ name, value, count }] sorted high → low.
export function averageByGroupForField(records, groupField, valueField, { round = 0 } = {}) {
  const groups = new Map()
  for (const rec of records) {
    const key = isBlank(rec[groupField]) ? '' : String(rec[groupField]).trim()
    if (!key) continue
    const v = rec[valueField]
    if (isBlank(v)) continue
    if (!groups.has(key)) groups.set(key, { sum: 0, n: 0 })
    const g = groups.get(key)
    g.sum += Number(v)
    g.n += 1
  }
  const factor = 10 ** round
  const rows = []
  for (const [name, g] of groups.entries()) {
    if (g.n === 0) continue
    rows.push({ name, value: Math.round((g.sum / g.n) * factor) / factor, count: g.n })
  }
  return rows.sort((a, b) => b.value - a.value)
}

// Average occupancy split by stabilisation status. Records with unknown
// Stabilised are skipped; blank occupancy is ignored in the average but the
// record still contributes to the group count.
export function occupancyByStabilisation(records) {
  const groups = new Map([
    ['Stabilised', { sum: 0, n: 0, count: 0 }],
    ['Not stabilised', { sum: 0, n: 0, count: 0 }],
  ])
  for (const rec of records) {
    let key = null
    if (rec.Stabilised === true) key = 'Stabilised'
    else if (rec.Stabilised === false) key = 'Not stabilised'
    if (!key) continue
    const g = groups.get(key)
    g.count += 1
    if (!isBlank(rec.Occupancy)) {
      g.sum += Number(rec.Occupancy)
      g.n += 1
    }
  }
  return Array.from(groups.entries())
    .map(([name, g]) => ({ name, value: g.n ? g.sum / g.n : 0, count: g.count, occCount: g.n }))
    .filter((r) => r.count > 0)
}

// Count of records per Date_Filter, sorted chronologically (oldest → newest)
// so the bar chart reads left-to-right as a timeline. Unknown periods sort last.
export function countByDateFilter(records) {
  const counts = new Map()
  for (const rec of records) {
    const key = isBlank(rec.Date_Filter) ? 'Unspecified' : String(rec.Date_Filter).trim()
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => {
      const ra = dateFilterRank(a.name)
      const rb = dateFilterRank(b.name)
      if (ra === null && rb === null) return a.name.localeCompare(b.name, 'en', { numeric: true })
      if (ra === null) return 1
      if (rb === null) return -1
      return ra - rb
    })
}
