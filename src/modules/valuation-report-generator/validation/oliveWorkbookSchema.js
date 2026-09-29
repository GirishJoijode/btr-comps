export const REQUIRED_SHEETS = [
  'EXECUTIVE SUMMARY',
  'Property Summary',
  'Income Report',
  'ERV Report',
  'Val Summary - Existing',
  'Rental Evidence',
]

export const OPTIONAL_SHEETS = [
  'Investment Evidence',
  'Rental Evidence Benchmarking',
  'WEB_EXPORT_META',
]

export const REQUIRED_LABELS = {
  'EXECUTIVE SUMMARY': ['EXECUTIVE SUMMARY', 'MARKET VALUE', 'INCOME SUMMARY', 'Property'],
  'Property Summary': ['PROPERTY SUMMARY', 'Property', 'Location'],
  'Income Report': ['INCOME SUMMARY', 'RUNNING COSTS', 'INCOME ANALYSIS'],
  'ERV Report': ['MARKET RENT', 'NET MARKET RENT'],
  'Val Summary - Existing': ['MARKET VALUE'],
  'Rental Evidence': ['RENTAL EVIDENCE'],
}

export const REQUIRED_FIELDS = [
  { sheet: 'EXECUTIVE SUMMARY', label: 'Property' },
  { sheet: 'EXECUTIVE SUMMARY', label: 'Market Value' },
  { sheet: 'EXECUTIVE SUMMARY', label: 'Valuation Date' },
  { sheet: 'Income Report', label: 'Net Income' },
  { sheet: 'EXECUTIVE SUMMARY', label: 'Gross ERV' },
  { sheet: 'ERV Report', label: 'Net Market Rent' },
]

/**
 * Future OLIVE exports may include a WEB_EXPORT_META sheet with:
 *   PRODUCT = OLIVE_BTR_VALUATION_REPORT
 *   SCHEMA_VERSION = 1
 * That check is optional until the sheet actually exists.
 */
export const FUTURE_META = {
  sheet: 'WEB_EXPORT_META',
  product: 'OLIVE_BTR_VALUATION_REPORT',
}
