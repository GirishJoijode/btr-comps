// -----------------------------------------------------------------------------
// Analysis / aggregation logic (summary KPIs + chart datasets)
// -----------------------------------------------------------------------------
import { isBlank } from './formatters'
import { latestModified, latestQuarterLabel } from './dateUtils'

// Rent / psf fields blended into the "by town" and "by region" averages.
const RENT_FIELDS = ['Studio_Rent', 'Bed1_Rent', 'Bed2_Rent', 'Bed3_Rent']
const PSF_FIELDS = ['Studio_psf', 'Bed1_psf', 'Bed2_psf', 'Bed3_psf']

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

// Generic: blended average of `valueFields`, grouped by `groupField`.
// Ignores blank / zero values. Returns [{ name, value }] sorted high → low.
function averageByGroup(records, groupField, valueFields, { round = 0 } = {}) {
  const groups = new Map()

  for (const rec of records) {
    const key = isBlank(rec[groupField]) ? '' : String(rec[groupField]).trim()
    if (!key) continue
    if (!groups.has(key)) groups.set(key, [])
    const bucket = groups.get(key)
    for (const f of valueFields) if (!isBlank(rec[f])) bucket.push(Number(rec[f]))
  }

  const factor = 10 ** round
  const rows = []
  for (const [name, values] of groups.entries()) {
    if (values.length === 0) continue
    const avg = values.reduce((acc, v) => acc + v, 0) / values.length
    rows.push({ name, value: Math.round(avg * factor) / factor })
  }
  return rows.sort((a, b) => b.value - a.value)
}

export function averageRentByTown(records) {
  return averageByGroup(records, 'Town', RENT_FIELDS)
}

export function averagePsfByTown(records) {
  return averageByGroup(records, 'Town', PSF_FIELDS, { round: 2 })
}

export function averageRentByRegion(records) {
  return averageByGroup(records, 'Regional_Filter', RENT_FIELDS)
}

export function averagePsfByRegion(records) {
  return averageByGroup(records, 'Regional_Filter', PSF_FIELDS, { round: 2 })
}

// Count of records per Date_Filter, sorted chronologically where possible.
export function countByDateFilter(records) {
  const counts = new Map()
  for (const rec of records) {
    const key = isBlank(rec.Date_Filter) ? 'Unspecified' : String(rec.Date_Filter).trim()
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }))
}
