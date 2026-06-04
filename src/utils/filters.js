// -----------------------------------------------------------------------------
// Filtering + search logic
// -----------------------------------------------------------------------------
import {
  FILTER_FIELDS,
  isFilterVisible,
  SEARCH_FIELDS,
} from '../config/filterConfig'
import { compareDateFilterDesc } from './dateUtils'
import { isBlank } from './formatters'

// Convert a raw value into a stable string for use as a filter option/value.
export function asOption(value) {
  if (value === true) return 'Yes'
  if (value === false) return 'No'
  if (isBlank(value)) return ''
  return String(value).trim()
}

// Empty filter state (one entry per filter field).
export const EMPTY_FILTERS = Object.fromEntries(
  FILTER_FIELDS.map((f) => [f.key, ''])
)

// Blank out any conditional filter whose controlling filter no longer makes it
// visible (e.g. London Zone after switching away from the London region), so a
// hidden selection can't keep silently filtering the data.
export function sanitizeFilters(filters) {
  const out = { ...filters }
  for (const field of FILTER_FIELDS) {
    if (!isFilterVisible(field, filters)) out[field.key] = ''
  }
  return out
}

// Sort a field's option list. Date_Filter is sorted latest-first; everything
// else alphabetically (numeric-aware).
function sortOptions(key, values) {
  if (key === 'Date_Filter') return values.sort(compareDateFilterDesc)
  return values.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
}

// Build the sorted list of unique options for each filter field (from the full
// dataset — no cross-filtering).
export function buildFilterOptions(records) {
  const options = {}
  for (const { key } of FILTER_FIELDS) {
    const set = new Set()
    for (const rec of records) {
      const opt = asOption(rec[key])
      if (opt !== '') set.add(opt)
    }
    options[key] = sortOptions(key, Array.from(set))
  }
  return options
}

// Power BI–style cascading options: each filter's available values are computed
// from the dataset filtered by every OTHER active filter + the search term, but
// NOT by the filter itself (so its own selection never hides its siblings). The
// currently-selected value is always kept in its own list so the dropdown can
// never go blank if it becomes invalid after another filter changes.
export function buildCascadingOptions(records, filters, search) {
  const options = {}
  for (const { key } of FILTER_FIELDS) {
    const others = { ...filters, [key]: '' }
    const subset = applyFilters(records, others, search)
    const set = new Set()
    for (const rec of subset) {
      const opt = asOption(rec[key])
      if (opt !== '') set.add(opt)
    }
    if (filters[key]) set.add(filters[key])
    options[key] = sortOptions(key, Array.from(set))
  }
  return options
}

// Apply the active dropdown filters + search term to the records.
export function applyFilters(records, filters, search) {
  const term = (search || '').trim().toLowerCase()

  return records.filter((rec) => {
    for (const { key } of FILTER_FIELDS) {
      const selected = filters[key]
      if (selected && selected !== asOption(rec[key])) return false
    }

    if (term) {
      const haystack = SEARCH_FIELDS.map((f) => rec[f])
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(term)) return false
    }

    return true
  })
}
