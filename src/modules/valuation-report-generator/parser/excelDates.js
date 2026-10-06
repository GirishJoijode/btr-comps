import * as XLSX from 'xlsx'

/**
 * Convert an Excel date serial (or SheetJS Date) to calendar parts using the
 * Excel 1900 date system. Parts are timezone-independent so 07/09 is never
 * silently read as 09/07.
 */
export function excelValueToDateParts(value) {
  if (value == null || value === '') return null

  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = XLSX.SSF?.parse_date_code?.(value)
    if (parsed?.y) return { year: parsed.y, month: parsed.m, day: parsed.d }
    const utc = new Date(Date.UTC(1899, 11, 30) + Math.round(value) * 86400000)
    return {
      year: utc.getUTCFullYear(),
      month: utc.getUTCMonth() + 1,
      day: utc.getUTCDate(),
    }
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return {
      year: value.getUTCFullYear(),
      month: value.getUTCMonth() + 1,
      day: value.getUTCDate(),
    }
  }

  if (typeof value === 'string') {
    const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (iso) {
      return { year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) }
    }
  }

  return null
}

export function formatUkLongDate(parts) {
  if (!parts) return null
  const { year, month, day } = parts
  if (!Number.isInteger(year) || month < 1 || month > 12 || day < 1 || day > 31) return null
  const d = new Date(Date.UTC(year, month - 1, day))
  if (Number.isNaN(d.getTime())) return null
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function formatIsoDateStamp(parts) {
  if (!parts) return ''
  const mm = String(parts.month).padStart(2, '0')
  const dd = String(parts.day).padStart(2, '0')
  return `${parts.year}${mm}${dd}`
}
