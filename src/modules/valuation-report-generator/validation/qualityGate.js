import { isMissing, isValidNumber } from '../utils/formatters'

export const REQUIRED_CORE = [
  { id: 'propertyName', label: 'Property name' },
  { id: 'valuationDate', label: 'Valuation date' },
  { id: 'units', label: 'Units' },
  { id: 'area', label: 'Area' },
  { id: 'marketValue', label: 'Market value' },
]

export const OPTIONAL_SECTIONS = [
  'Letting profile',
  'Income analysis',
  'Rental evidence and benchmarks',
  'Running costs and net market rent',
  'Investment value summary',
  'Further information',
  'Property photographs',
]

const REQUIRED_MESSAGE = 'Report cannot be generated because required valuation data is missing.'

function near(a, b, tolerance = 1) {
  if (!isValidNumber(a) || !isValidNumber(b)) return true
  return Math.abs(a - b) <= tolerance
}

function ratioError(label, value) {
  if (isMissing(value)) return null
  if (!isValidNumber(value) || value < 0 || value > 1) {
    return `${label} could not be read as a percentage.`
  }
  return null
}

export function assessReport(model) {
  const errors = []
  const warnings = []
  if (!model) {
    return { canGenerate: false, errors: ['Property name', 'Valuation date', 'Units', 'Area', 'Market value'], warnings, userMessage: REQUIRED_MESSAGE }
  }

  const name = model.meta?.propertyName
  const date = model.meta?.valuationDate
  const year = model.meta?.valuationDateParts?.year
  const units = model.property?.units
  const area = model.property?.areaSqFt
  const marketValue = model.valuation?.marketValue

  if (isMissing(name)) errors.push('Property name')
  if (isMissing(date) || /invalid date/i.test(String(date)) || (year != null && (year < 1990 || year > 2100))) {
    errors.push('Valuation date')
  }
  if (!isValidNumber(units) || units <= 0 || !Number.isInteger(units)) errors.push('Units')
  if (!isValidNumber(area) || area <= 0) errors.push('Area')
  if (!isValidNumber(marketValue) || marketValue <= 0) errors.push('Market value')

  for (const check of [
    ratioError('Occupancy', model.currentIncome?.occupancy),
    ratioError('Initial yield', model.valuation?.netInitialYield),
    ratioError('Equivalent yield', model.valuation?.equivalentYield),
    ratioError('Reversionary yield', model.valuation?.reversionaryYield),
    ratioError('IRR', model.valuation?.irr),
  ]) {
    if (check) errors.push(check)
  }

  const statement = model.currentIncome?.statement || []
  const grossLine = statement.find((row) => row.name === 'Total')
  const netLine = statement.find((row) => row.name === 'Net income')
  if (!near(model.currentIncome?.grossIncome, grossLine?.amount)) {
    warnings.push('Gross income differs between the headline and the income statement. Headline gross income is used on summary cards.')
  }
  if (!near(model.currentIncome?.netIncome, netLine?.amount)) {
    warnings.push('Net income differs between the headline and the income statement. Headline net income is used on summary cards.')
  }
  const ervTotal = (model.marketRent?.assessment || []).find((row) => row.name === 'Total')
  const ervNet = (model.marketRent?.assessment || []).find((row) => /^net market rent$/i.test(row.name))
  if (!near(model.marketRent?.grossErv, ervTotal?.amount)) {
    warnings.push('Gross ERV differs between the headline and the market-rent assessment. Headline gross ERV is used on summary cards.')
  }
  if (!near(model.marketRent?.netErv, ervNet?.amount)) {
    warnings.push('Net ERV differs between the headline and the market-rent assessment. Headline net ERV is used on summary cards.')
  }

  if (!model.images?.propertyImage) {
    warnings.push('No property image was found. The property overview will be text only.')
  }
  if (!model.investment?.evidenceRows) {
    warnings.push('No investment evidence was found. Comparable transactions are not included.')
  }
  if (!model.cashflow?.included && !(model.yieldProfile || []).some((row) => isValidNumber(row.netOperating) || isValidNumber(row.tripleNet))) {
    warnings.push('No investment cash flow or yield profile was found. The Investment Value section will not be included.')
  }
  if (isMissing(model.furtherInfo?.description)) {
    warnings.push('Description was not provided, so it is left out of Further Information.')
  }
  const conditionNames = (model.furtherInfo?.condition || []).map((row) => row.name)
  if (!conditionNames.some((name) => /^epc$/i.test(name))) {
    warnings.push('No EPC information was found.')
  }

  const beds = model.rentalBenchmarks?.beds || []
  const present = beds.filter((bed) => isValidNumber(bed.subjectRent) || isValidNumber(bed.comparableRent))
  const missingBeds = beds.filter((bed) => !present.includes(bed))
  if (present.length && missingBeds.length) {
    warnings.push(`No ${missingBeds.map((bed) => bed.type.toLowerCase()).join(' or ')} rental evidence was found. Those benchmarks are omitted.`)
  }
  for (const bed of present) {
    if (isValidNumber(bed.subjectRent) && !isValidNumber(bed.comparableRent)) {
      warnings.push(`No ${bed.type.toLowerCase()} comparable rents were found, so that variance is omitted.`)
    }
  }
  if ((model.rentalBenchmarks?.schemeCount || 0) === 0) {
    warnings.push('No rental evidence schemes were found. The evidence and benchmark pages will not be included.')
  }

  const uniqueWarnings = [...new Set(warnings)]
  return {
    canGenerate: errors.length === 0,
    errors,
    warnings: uniqueWarnings,
    userMessage: errors.length ? REQUIRED_MESSAGE : null,
  }
}
