import {
  FUTURE_META,
  REQUIRED_FIELDS,
  REQUIRED_LABELS,
  REQUIRED_SHEETS,
} from './oliveWorkbookSchema'
import {
  findLabel,
  findLabelWithValue,
  labelledText,
  looksLikeExcelError,
  makeRowReader,
  sheetHasLabel,
  toNumber,
} from '../parser/sheetHelpers'

const USER_ERROR =
  'Invalid OLIVE valuation export. The workbook structure does not match the expected report template.'

export function validateOliveWorkbook(workbook, XLSX) {
  const errors = []
  const warnings = []
  const rowsFor = makeRowReader(XLSX)
  const names = workbook.SheetNames || []

  for (const sheet of REQUIRED_SHEETS) {
    if (!names.includes(sheet)) {
      errors.push(`Missing required sheet: ${sheet}`)
    }
  }

  const exec = rowsFor(workbook, 'EXECUTIVE SUMMARY')
  const prop = rowsFor(workbook, 'Property Summary')
  const income = rowsFor(workbook, 'Income Report')
  const erv = rowsFor(workbook, 'ERV Report')

  const byName = {
    'EXECUTIVE SUMMARY': exec,
    'Property Summary': prop,
    'Income Report': income,
    'ERV Report': erv,
    'Val Summary - Existing': rowsFor(workbook, 'Val Summary - Existing'),
    'Rental Evidence': rowsFor(workbook, 'Rental Evidence'),
  }

  for (const [sheet, labels] of Object.entries(REQUIRED_LABELS)) {
    const rows = byName[sheet]
    if (!rows) continue
    for (const label of labels) {
      if (!sheetHasLabel(rows, label)) {
        errors.push(`Missing expected heading "${label}" on ${sheet}`)
      }
    }
  }

  for (const field of REQUIRED_FIELDS) {
    const rows = byName[field.sheet]
    if (!rows) continue
    const pos = findLabelWithValue(rows, field.label)
    if (!pos) {
      errors.push(`Required field "${field.label}" is empty`)
    } else if (looksLikeExcelError(pos.value)) {
      errors.push(`Required field "${field.label}" contains an Excel error`)
    }
  }

  if (exec && prop) {
    const n1 = labelledText(exec, 'Property')
    const n2 = labelledText(prop, 'Property')
    if (n1 && n2 && n1.toLowerCase() !== n2.toLowerCase()) {
      errors.push('Property name does not match between Executive Summary and Property Summary')
    }
  }

  if (exec && income) {
    const occupancy = findAccommodation(exec)
    const areaIncomeTotal = findIncomeTotalArea(income)
    if (occupancy.areaSqFt && areaIncomeTotal && Math.abs(occupancy.areaSqFt - areaIncomeTotal) > 1) {
      warnings.push('NIA / area differs between Executive Summary and Income Report')
    }
    const unitsIncomeTotal = findIncomeTotalUnits(income)
    if (occupancy.units && unitsIncomeTotal && occupancy.units !== unitsIncomeTotal) {
      warnings.push('Unit count differs between Executive Summary and Income Report')
    }
  }

  const metaSheet = names.includes(FUTURE_META.sheet)
  if (metaSheet) {
    const metaRows = rowsFor(workbook, FUTURE_META.sheet)
    const product = labelledText(metaRows, 'PRODUCT') || labelledText(metaRows, 'Product')
    if (product && product !== FUTURE_META.product) {
      errors.push('WEB_EXPORT_META product identifier is not recognised')
    }
  }

  const checksPassed =
    errors.length === 0
      ? [
          'Required sheets present',
          'Anchor headings found',
          'Required fields populated',
          'Property name consistent across summary sheets',
        ]
      : []

  return {
    valid: errors.length === 0,
    errors: errors.length ? [USER_ERROR, ...errors] : [],
    userMessage: errors.length ? USER_ERROR : null,
    warnings,
    checksPassed,
  }
}

function findAccommodation(execRows) {
  const pos = findLabel(execRows, 'Accommodation')
  if (!pos) return { areaSqFt: null, units: null }
  const next = execRows[pos.r + 1] || []
  return {
    areaSqFt: toNumber(next[2] ?? next[pos.c + 1]),
    units: toNumber(next[3] ?? next[pos.c + 2]),
  }
}

function findIncomeTotalArea(incomeRows) {
  const pos = findLabel(incomeRows, 'INCOME ANALYSIS - OVERALL')
  if (!pos) return null
  for (let r = pos.r; r < Math.min(incomeRows.length, pos.r + 12); r++) {
    const row = incomeRows[r] || []
    if (String(row[0]).trim().toLowerCase() === 'total' && toNumber(row[2])) {
      return toNumber(row[2])
    }
  }
  return null
}

function findIncomeTotalUnits(incomeRows) {
  const pos = findLabel(incomeRows, 'INCOME ANALYSIS - OVERALL')
  if (!pos) return null
  for (let r = pos.r; r < Math.min(incomeRows.length, pos.r + 12); r++) {
    const row = incomeRows[r] || []
    if (String(row[0]).trim().toLowerCase() === 'total' && toNumber(row[1])) {
      return toNumber(row[1])
    }
  }
  return null
}
