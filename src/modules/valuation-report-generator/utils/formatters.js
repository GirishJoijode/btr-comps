const EXCEL_ERROR = /^#(N\/A|VALUE!|REF!|DIV\/0!|NAME\?|NULL!|NUM!|GETTING_DATA)/i

/** True for blank, non-finite, or Excel error values. Zero is a real number and is not missing. */
export function isMissing(value) {
  if (value == null || value === '') return true
  if (typeof value === 'number') return !Number.isFinite(value)
  if (typeof value === 'string') {
    const text = value.trim()
    return (
      text === '' ||
      /^(nan|null|undefined|infinity|-infinity)$/i.test(text) ||
      EXCEL_ERROR.test(text)
    )
  }
  return false
}

export const isMissingValue = isMissing

export function isValidNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

/** A ratio such as 0.0525. Zero is valid. Values above 1 are not treated as ratios. */
export function isValidPercentage(value) {
  return isValidNumber(value) && value >= 0 && value <= 1
}

export const safeCurrency = (value, options) => money(value, options)
export const safePercentage = percent
export const safeNumber = number
export const safeText = dash

export function safeDate(value) {
  if (isMissing(value)) return null
  const text = String(value).trim()
  if (/invalid date/i.test(text)) return null
  return text
}

export function hasMeaningfulData(value) {
  if (isMissing(value)) return false
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') return true
  if (Array.isArray(value)) return value.some(hasMeaningfulData)
  if (typeof value === 'object') {
    return Object.entries(value).some(([key, item]) => key !== 'included' && hasMeaningfulData(item))
  }
  return false
}

/** Keep a row when at least one listed field is present. Zero counts as present. */
export function filterValidRows(rows, keys) {
  return (rows || []).filter((row) => keys.some((key) => !isMissing(row?.[key])))
}

export function usableImage(url) {
  return typeof url === 'string' && /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(url) ? url : null
}

export function money(value, { compact = false } = {}) {
  if (isMissing(value) || !Number.isFinite(Number(value))) return '—'
  const n = Number(value)
  if (compact && Math.abs(n) >= 1_000_000) {
    const m = n / 1_000_000
    const digits = Math.abs(m) >= 10 ? 2 : 2
    return `£${m.toFixed(digits)}m`
  }
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(n)
}

export function money2(value) {
  if (isMissing(value) || !Number.isFinite(Number(value))) return '—'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value))
}

export function number(value, digits = 0) {
  if (isMissing(value) || !Number.isFinite(Number(value))) return '—'
  return Number(value).toLocaleString('en-GB', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })
}

export function percent(value, digits = 1) {
  if (isMissing(value) || !Number.isFinite(Number(value))) return '—'
  return `${(Number(value) * 100).toFixed(digits)}%`
}

export function sqft(value) {
  if (value == null || !Number.isFinite(Number(value))) return '—'
  return `${number(value, 0)} sq ft`
}

export function dash(value) {
  if (isMissing(value)) return '—'
  return String(value)
}

export function signedMoney(value, digits = 0) {
  if (isMissing(value) || !Number.isFinite(Number(value))) return '—'
  const n = Number(value)
  const body = digits === 2 ? money2(Math.abs(n)) : money(Math.abs(n))
  if (n < 0) return `−${body}`
  return body
}

/** Subject minus comparable average. Positive means the subject is above the average. */
export function variancePhrase(delta, digits = 0) {
  if (isMissing(delta) || !Number.isFinite(Number(delta))) return '—'
  const n = Number(delta)
  if (Math.abs(n) < 0.005) return 'In line with average'
  const dir = n > 0 ? 'above' : 'below'
  const body = digits === 2 ? money2(Math.abs(n)) : money(Math.abs(n))
  return `${body} ${dir} average`
}

export function isReportedUnitRow(row) {
  if (!row) return false
  if (row.type === 'Total') return true
  return ['units', 'areaSqFt', 'letAreaSqFt', 'incomePa', 'passingPa', 'ervPa'].some(
    (key) => typeof row[key] === 'number' && row[key] !== 0
  )
}

export function millions(value) {
  if (isMissing(value) || !Number.isFinite(Number(value))) return '—'
  const n = Number(value) / 1_000_000
  const body = Math.abs(n).toFixed(2)
  return n < 0 ? `(${body})` : body
}

export function pcm(value) {
  if (isMissing(value) || !Number.isFinite(Number(value))) return '—'
  return `£${Math.round(Number(value)).toLocaleString('en-GB')} pcm`
}
