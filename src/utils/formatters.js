// -----------------------------------------------------------------------------
// Value formatting helpers
// -----------------------------------------------------------------------------

// Treat 0, null, undefined, empty strings as "no value".
export function isBlank(value) {
  if (value === null || value === undefined) return true
  if (typeof value === 'string' && value.trim() === '') return true
  if (typeof value === 'number' && value === 0) return true
  return false
}

const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
})

// Rent fields -> "£1,234 pcm". Blank / 0 values render as an empty string.
export function formatRent(value) {
  if (isBlank(value)) return ''
  return `${currencyFormatter.format(Math.round(value))} pcm`
}

// psf fields -> 2 decimal places. Blank / 0 values render as an empty string.
export function formatPsf(value) {
  if (isBlank(value)) return ''
  return Number(value).toFixed(2)
}

// Occupancy is stored as a 0-1 fraction -> render as a percentage.
export function formatPercent(value) {
  if (isBlank(value)) return ''
  return `${(Number(value) * 100).toFixed(1)}%`
}

// Plain integers (e.g. Units) -> thousands separated. Blank / 0 -> "".
export function formatNumber(value) {
  if (isBlank(value)) return ''
  return new Intl.NumberFormat('en-GB').format(value)
}

// Booleans -> "Yes" / "No" (and blank when not set).
export function formatBool(value) {
  if (value === true) return 'Yes'
  if (value === false) return 'No'
  return ''
}

// Render a "Last modified" ISO date as a friendly date.
export function formatDate(value) {
  if (isBlank(value)) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// Compact currency for chart axes, e.g. 1450 -> "£1.4k".
export function formatCurrencyShort(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return ''
  if (Math.abs(n) >= 1000) return `£${(n / 1000).toFixed(1)}k`
  return `£${Math.round(n)}`
}

// Full currency, e.g. 1450 -> "£1,450".
export function formatCurrency(value) {
  return `£${Number(value).toLocaleString('en-GB')}`
}
