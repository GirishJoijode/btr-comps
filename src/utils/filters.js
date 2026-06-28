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

// Empty filter state: each field holds an array of selected values (empty = All).
export const EMPTY_FILTERS = Object.fromEntries(
  FILTER_FIELDS.map((f) => [f.key, []])
)

// Normalise a filter field to an array of selected values.
export function getFilterSelections(filters, key) {
  const val = filters[key]
  if (Array.isArray(val)) return val
  if (val && val !== '') return [val]
  return []
}

export function hasAnyFilterSelection(filters) {
  return FILTER_FIELDS.some(({ key }) => getFilterSelections(filters, key).length > 0)
}

// Blank out any conditional filter whose controlling filter no longer makes it
// visible (e.g. London Zone after switching away from the London region).
export function sanitizeFilters(filters) {
  const out = { ...filters }
  for (const field of FILTER_FIELDS) {
    if (!isFilterVisible(field, filters)) out[field.key] = []
  }
  return out
}

function sortOptions(key, values) {
  if (key === 'Date_Filter') return values.sort(compareDateFilterDesc)
  return values.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
}

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
// from the dataset filtered by every OTHER active filter + search, but NOT by
// the filter itself. Selected values are always kept visible in their own list.
export function buildCascadingOptions(records, filters, search) {
  const options = {}
  for (const { key } of FILTER_FIELDS) {
    const others = { ...filters, [key]: [] }
    const subset = applyFilters(records, others, search)
    const set = new Set()
    for (const rec of subset) {
      const opt = asOption(rec[key])
      if (opt !== '') set.add(opt)
    }
    for (const sel of getFilterSelections(filters, key)) set.add(sel)
    options[key] = sortOptions(key, Array.from(set))
  }
  return options
}

function recordMatchesField(rec, key, selected) {
  if (!selected.length) return true
  return selected.includes(asOption(rec[key]))
}

// Apply multi-select filters (OR within a field, AND across fields) + search.
export function applyFilters(records, filters, search) {
  const term = (search || '').trim().toLowerCase()

  return records.filter((rec) => {
    for (const { key } of FILTER_FIELDS) {
      if (!recordMatchesField(rec, key, getFilterSelections(filters, key))) return false
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
