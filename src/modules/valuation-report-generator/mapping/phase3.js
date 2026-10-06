import { findLabel, toNumber, toText } from '../parser/sheetHelpers'

function lineAfter(rows, label, fromRow, endRow) {
  const pos = findLabel(rows, label, { fromRow })
  if (!pos || (endRow != null && pos.r >= endRow)) return null
  const row = rows[pos.r] || []
  const nums = []
  for (let c = pos.c + 1; c < row.length; c++) {
    const n = toNumber(row[c])
    if (n != null) nums.push(n)
  }
  return { amount: nums[0] ?? null, perSqFt: nums[1] ?? null, perUnit: nums[2] ?? null }
}

const INCOME_LINES = [
  { label: 'Rental Income', name: 'Rental income' },
  { label: 'Ancillary Income', name: 'Ancillary income' },
  { label: 'Total', name: 'Total' },
  { label: 'Bad Debt', name: 'Bad debt' },
  { label: 'Total (net of bad debt)', name: 'Total (net of bad debt)' },
  { label: 'Occupancy', name: 'Occupancy', ratio: true },
  { label: 'Total Costs', name: 'Total costs' },
  { label: 'Net Income', name: 'Net income' },
  { label: 'Gross to Net Pre Mgmt Fee & Cap-ex', name: 'Gross to net', ratio: true },
]

export function parseIncomeStatement(exec) {
  if (!exec) return []
  const start = findLabel(exec, 'INCOME SUMMARY')?.r ?? 0
  const end = findLabel(exec, 'MARKET RENT')?.r ?? exec.length
  return INCOME_LINES.map((line) => {
    const values = lineAfter(exec, line.label, start, end)
    return {
      name: line.name,
      ratio: Boolean(line.ratio),
      amount: values?.amount ?? null,
      perSqFt: line.ratio ? null : values?.perSqFt ?? null,
      perUnit: line.ratio ? null : values?.perUnit ?? null,
    }
  }).filter((row) => row.amount != null)
}

function yieldCells(exec, label, fromRow) {
  const pos = findLabel(exec, label, { fromRow })
  if (!pos) return { netOperating: null, tripleNet: null }
  const row = exec[pos.r] || []
  return {
    netOperating: toNumber(row[11]),
    tripleNet: toNumber(row[12]),
  }
}

export function parseYieldProfile(exec) {
  if (!exec) return null
  const from = findLabel(exec, 'MARKET VALUE')?.r ?? 0
  const initial = yieldCells(exec, 'Initial', from)
  const reversionary = yieldCells(exec, 'Reversionary', from)
  const equivalent = yieldCells(exec, 'True Equivalent', from)
  const rows = [
    { measure: 'Initial', ...initial },
    { measure: 'Reversionary', ...reversionary },
    { measure: 'Equivalent', ...equivalent },
  ]
  if (!rows.some((row) => row.netOperating != null || row.tripleNet != null)) return null
  return rows
}

const CASH_ROWS = [
  { match: /^income$/i, key: 'income', label: 'Income' },
  { match: /^running costs$/i, key: 'runningCosts', label: 'Running costs' },
  { match: /^net income$/i, key: 'netIncome', label: 'Net income' },
  { match: /^lifecycle/i, key: 'lifecycle', label: 'Lifecycle' },
  { match: /^cap-ex$/i, key: 'capex', label: 'Major capex' },
]

export function parseCashflow(rows) {
  if (!rows) return { included: false }
  const heading = findLabel(rows, 'VALUATION CASHFLOW SUMMARY')
  if (!heading) return { included: false }
  let header = null
  for (let r = heading.r; r < Math.min(rows.length, heading.r + 6); r++) {
    if (String(rows[r]?.[2] ?? '').trim() === 'Day 1') header = r
  }
  if (header == null) return { included: false }
  const labels = []
  for (let c = 2; c <= 12; c++) {
    const value = rows[header][c]
    labels.push(value === '' || value == null ? null : String(value))
  }
  const series = []
  let exitValue = null
  for (let r = header + 1; r < Math.min(rows.length, header + 14); r++) {
    const name = toText(rows[r]?.[1])
    if (!name) continue
    if (/^exit value$/i.test(name)) {
      exitValue = toNumber(rows[r][12])
      continue
    }
    const spec = CASH_ROWS.find((item) => item.match.test(name))
    if (!spec) continue
    const values = []
    for (let c = 2; c <= 12; c++) values.push(toNumber(rows[r][c]))
    series.push({ key: spec.key, label: spec.label, values })
  }
  const capex = series.find((row) => row.key === 'capex')
  const capexYears = (capex?.values || [])
    .map((value, index) => ({ value, index }))
    .filter((item) => item.index > 0 && typeof item.value === 'number' && item.value !== 0)
    .map((item) => item.index)
  const net = series.find((row) => row.key === 'netIncome')
  const included = series.length >= 3 && labels.filter(Boolean).length >= 10
  return {
    included,
    labels,
    series,
    exitValue,
    year10NetIncome: net?.values?.[10] ?? null,
    capexYears,
  }
}

function populated(value) {
  if (value == null || value === '') return false
  return true
}

export function parseFurtherInfo(prop) {
  if (!prop) return { included: false, profile: [], amenities: [], accommodation: [], condition: [] }
  const description = toText(prop[findLabel(prop, 'Description')?.r]?.[2])
  const situation = toText(prop[findLabel(prop, 'Situation')?.r]?.[2])
  const amenityNames = ['Concierge', 'Social & Entertainment', 'Leisure & Wellness', 'Outdoor', 'Co-working', 'Other']
  const amenities = amenityNames
    .map((name) => {
      const pos = findLabel(prop, name)
      const value = pos ? toText(prop[pos.r]?.[pos.c + 1]) : null
      return value ? { name, value } : null
    })
    .filter(Boolean)

  const accStart = findLabel(prop, 'Accommodation')
  const accommodation = []
  if (accStart) {
    for (let r = accStart.r + 1; r < Math.min(prop.length, accStart.r + 8); r++) {
      const name = toText(prop[r]?.[1])
      if (!name || /^sq ft$/i.test(name)) continue
      if (/^height|^car parking|^condition/i.test(name)) break
      const area = toNumber(prop[r][2])
      const units = toNumber(prop[r][3])
      const average = toNumber(prop[r][4])
      const live = [area, units, average].some((n) => typeof n === 'number' && n !== 0)
      if (!live) continue
      accommodation.push({ name, areaSqFt: area, units, average })
    }
  }

  const conditionLabels = [
    ['Year of completion', 'Year of completion'],
    ['Year of Modernisation', 'Year of modernisation'],
    ['EPC', 'EPC'],
    ['EWS 1', 'EWS1'],
    ['Dual Core', 'Dual core'],
    ['Planning', 'Planning'],
  ]
  const condition = conditionLabels
    .map(([label, name]) => {
      const pos = findLabel(prop, label)
      if (!pos) return null
      const value = prop[pos.r]?.[pos.c + 1]
      if (!populated(value) && value !== 0) return null
      const text = toText(value) || (typeof value === 'number' ? String(value) : null)
      return text ? { name, value: text } : null
    })
    .filter(Boolean)

  const included = Boolean(description || situation || amenities.length || accommodation.length || condition.length)
  return {
    included,
    description: description || null,
    situation: situation || null,
    amenities,
    accommodation,
    storeys:
      toNumber(prop[findLabel(prop, 'Height (Max Storeys)')?.r]?.[2]) ??
      toNumber(prop[findLabel(prop, 'Height')?.r]?.[2]),
    carParking: toNumber(prop[findLabel(prop, 'Car Parking')?.r]?.[2]),
    condition,
  }
}
