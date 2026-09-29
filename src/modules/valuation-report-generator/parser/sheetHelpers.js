function norm(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function makeRowReader(XLSX) {
  return function rowsFor(workbook, sheetName) {
    const ws = workbook.Sheets[sheetName]
    if (!ws) return null
    return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true })
  }
}

export function cell(rows, r, c) {
  if (!rows || r < 0 || c < 0) return null
  const row = rows[r]
  if (!row) return null
  const v = row[c]
  if (v === '' || v == null) return null
  return v
}

export function findExactLabel(rows, label, { fromRow = 0 } = {}) {
  const target = norm(label)
  if (!rows || !target) return null
  for (let r = fromRow; r < rows.length; r++) {
    const row = rows[r] || []
    for (let c = 0; c < row.length; c++) {
      if (norm(row[c]) === target) return { r, c }
    }
  }
  return null
}

export function findLabel(rows, label, { fromRow = 0 } = {}) {
  const target = norm(label)
  if (!rows || !target) return null
  const exact = findExactLabel(rows, label, { fromRow })
  if (exact) return exact
  for (let r = fromRow; r < rows.length; r++) {
    const row = rows[r] || []
    for (let c = 0; c < row.length; c++) {
      const text = norm(row[c])
      if (text && text.includes(target)) return { r, c }
    }
  }
  return null
}

export function valueRight(rows, pos) {
  if (!pos) return null
  const row = rows[pos.r] || []
  for (let c = pos.c + 1; c < row.length; c++) {
    const v = row[c]
    if (v === '' || v == null) continue
    return v
  }
  return null
}

export function toNumber(value) {
  if (value == null || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'boolean') return null
  const n = Number(String(value).replace(/[,£%\s]/g, ''))
  return Number.isFinite(n) ? n : null
}

export function toText(value) {
  if (value == null || value === '') return null
  if (value instanceof Date) return null
  const s = String(value).trim()
  return s === '' ? null : s
}

export function looksLikeExcelError(value) {
  if (typeof value !== 'string') return false
  return /^#(N\/A|VALUE!|REF!|DIV\/0!|NAME\?|NULL!|NUM!|GETTING_DATA)/i.test(value.trim())
}

export function sheetHasLabel(rows, label) {
  return Boolean(findLabel(rows, label))
}

/**
 * Find a label that actually has a neighbouring value. Section headings such as
 * "MARKET VALUE" normalise to the same text as the data label "Market Value"
 * but have nothing to the right — those must be skipped.
 */
export function findLabelWithValue(rows, label, { fromRow = 0 } = {}) {
  const target = norm(label)
  if (!rows || !target) return null
  let includesHit = null
  for (let r = fromRow; r < rows.length; r++) {
    const row = rows[r] || []
    for (let c = 0; c < row.length; c++) {
      const text = norm(row[c])
      if (!text) continue
      const exact = text === target
      const partial = !exact && text.includes(target)
      if (!exact && !partial) continue
      const value = valueRight(rows, { r, c })
      if (value == null) continue
      if (exact) return { r, c, value }
      if (!includesHit) includesHit = { r, c, value }
    }
  }
  return includesHit
}

export function labelledNumber(rows, label, opts) {
  const pos = findLabelWithValue(rows, label, opts)
  return pos ? toNumber(pos.value) : null
}

export function labelledText(rows, label, opts) {
  const pos = findLabelWithValue(rows, label, opts)
  return pos ? toText(pos.value) : null
}
