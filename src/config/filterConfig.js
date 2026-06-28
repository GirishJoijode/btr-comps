// -----------------------------------------------------------------------------
// Filter + search configuration
// -----------------------------------------------------------------------------

// Dropdown filter fields, in display order. `key` must match a Ninox field.
//
// `visibleWhen` makes a filter conditional: it only renders when the value of
// another filter (`key`) is one of `in`. Conditional filters are blanked
// automatically when they are hidden (see sanitizeFilters in utils/filters).
export const FILTER_FIELDS = [
  { key: 'Date_Filter', label: 'Date' },
  { key: 'Regional_Filter', label: 'Region' },
  { key: 'Town', label: 'Town' },
  {
    key: 'Sub_location_Filter',
    label: 'Sub location',
    visibleWhen: { key: 'Regional_Filter', in: ['London', 'Manchester'] },
  },
  {
    key: 'London_Zone',
    label: 'London zone',
    visibleWhen: { key: 'Regional_Filter', in: ['London'] },
  },
  { key: 'Operator', label: 'Operator' },
  { key: 'Amenity_Grade', label: 'Amenity grade' },
  { key: 'Source_Verified', label: 'Source verified' },
  { key: 'Stabilised', label: 'Stabilised' },
]

// Fields scanned by the free-text search box.
export const SEARCH_FIELDS = ['Scheme', 'Town', 'Operator', 'Amenities', 'Comments']

// Whether a filter field should be shown, given the current filter selections.
export function isFilterVisible(field, filters) {
  const cond = field.visibleWhen
  if (!cond) return true
  const parent = filters[cond.key]
  const selected = Array.isArray(parent) ? parent : parent ? [parent] : []
  if (selected.length === 0) return false
  return selected.some((v) => cond.in.includes(v))
}

// The subset of FILTER_FIELDS currently visible for the given selections.
export function visibleFilterFields(filters) {
  return FILTER_FIELDS.filter((f) => isFilterVisible(f, filters))
}
