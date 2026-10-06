import { isValidNumber, usableImage } from '../utils/formatters'

function finite(value) {
  return isValidNumber(value)
}

export function evidenceSchemes(model) {
  return (model.rentalEvidence || []).filter((row) => row && !row.isAverage && row.scheme)
}

export function activeBenchmarkBeds(model) {
  return (model.rentalBenchmarks?.beds || []).filter((bed) =>
    [bed.subjectRent, bed.comparableRent, bed.subjectPsf, bed.comparablePsf].some(finite),
  )
}

function hasLetting(model) {
  const metrics = model.currentIncome?.lettingMetrics || {}
  const income = model.currentIncome || {}
  return [
    income.grossIncome,
    income.occupancy,
    income.ervVacantSpace,
    metrics.lettingsLast12Months,
    metrics.averageStayMonths,
    metrics.incomePsfOnLetSpace,
    metrics.incomeGrowthLast5Months,
    metrics.costsPerUnit,
  ].some(finite)
}

function hasAnalysis(model) {
  return (model.incomeByUnitType || []).some(
    (row) => row.type !== 'Total' && (finite(row.units) || finite(row.incomePa)),
  )
}

function hasCosts(model) {
  return finite(model.operatingCosts?.total) || (model.operatingCosts?.categories || []).some((row) => finite(row.costPa))
}

function hasIncome(model) {
  return finite(model.currentIncome?.grossIncome) || (model.currentIncome?.statement || []).length > 0
}

function hasMarketSummary(model) {
  return finite(model.marketRent?.grossErv) || (model.marketRent?.unitTypes || []).some((row) => finite(row.ervPa) || finite(row.passingPa))
}

function hasAssessment(model) {
  return (model.marketRent?.assessment || []).some((row) => finite(row.amount))
}

function hasYields(model) {
  return (model.yieldProfile || []).some((row) => finite(row.netOperating) || finite(row.tripleNet))
}

function hasCashflow(model) {
  return Boolean(
    model.cashflow?.included &&
      (model.cashflow.series || []).some((row) => (row.values || []).some(finite)),
  )
}

export function hasFurther(model) {
  const info = model.furtherInfo
  if (!info?.included) return false
  return Boolean(
    info.description ||
      info.situation ||
      info.amenities?.length ||
      info.accommodation?.length ||
      info.condition?.length ||
      finite(info.storeys) ||
      finite(info.carParking),
  )
}

function hasBenchmark(model) {
  return evidenceSchemes(model).length > 0 && activeBenchmarkBeds(model).length > 0
}

/**
 * Single page list for contents, numbering and PDF composition.
 * A section divider is included only when that section has at least one content page.
 */
export function reportPlan(model) {
  const photo = usableImage(model.images?.propertyImage)
  const second = usableImage(model.images?.additional?.[0])
  const place = [model.meta?.propertyName, model.meta?.location].filter(Boolean).join(', ')

  const propertyPages = ['property']
  if (hasIncome(model)) propertyPages.push('income')
  if (hasLetting(model)) propertyPages.push('letting')
  if (hasAnalysis(model)) propertyPages.push('analysis')
  if (hasCosts(model)) propertyPages.push('costs')

  const marketPages = []
  if (hasMarketSummary(model)) marketPages.push('marketSummary')
  if (hasAssessment(model)) marketPages.push('runningCosts')
  if (evidenceSchemes(model).length) marketPages.push('evidence')
  if (hasBenchmark(model)) {
    marketPages.push('benchmarkRent')
    marketPages.push('benchmarkPsf')
  }

  const investmentPages = []
  if (hasYields(model)) investmentPages.push('valuation')
  if (hasCashflow(model)) investmentPages.push('cashflow')

  const furtherPages = hasFurther(model) ? ['further'] : []

  const blocks = [
    { key: 'exec', title: 'Executive Summary', blurb: 'Valuation overview and headline metrics', pages: ['exec'] },
    {
      key: 'property',
      title: 'Property & Income Summary',
      blurb: 'Asset profile, income and operating costs',
      pages: propertyPages,
      kicker: 'PROPERTY AND INCOME',
      dividerTitle: 'Property & income summary',
      lede: `Asset profile, current income and operating costs${place ? ` for ${place}` : ''}.`,
      image: photo,
    },
    {
      key: 'market',
      title: 'Market Rent Summary',
      blurb: 'ERV, rental evidence and benchmarking',
      pages: marketPages,
      kicker: 'MARKET RENT',
      dividerTitle: 'Market rent summary',
      lede: 'ERV, rental evidence and benchmarking, kept separate from current passing income.',
      image: second || photo,
    },
    {
      key: 'investment',
      title: 'Investment Value Summary',
      blurb: 'Current valuation, returns and cash flow',
      pages: investmentPages,
      kicker: 'INVESTMENT VALUE',
      dividerTitle: 'Investment value summary',
      lede: 'Current market value, yields and the workbook ten-year cash flow.',
      image: photo,
    },
    {
      key: 'further',
      title: 'Further Information',
      blurb: 'Property details, accommodation and condition',
      pages: furtherPages,
      kicker: 'FURTHER INFORMATION',
      dividerTitle: 'Further information',
      lede: 'Property details, accommodation and condition from the workbook.',
      image: second || photo,
    },
  ].filter((block) => block.pages.length > 0)

  const sections = blocks.map((block, index) => ({
    key: block.key,
    title: block.title,
    blurb: block.blurb,
    number: String(index + 1).padStart(2, '0'),
  }))
  const numberFor = (key) => sections.find((item) => item.key === key)?.number || ''

  const pages = [{ id: 'cover' }, { id: 'contents' }]
  for (const block of blocks) {
    const section = numberFor(block.key)
    if (block.key !== 'exec') {
      pages.push({
        id: 'divider',
        section,
        kicker: `${section}  ${block.kicker}`,
        title: block.dividerTitle,
        lede: block.lede,
        image: block.image,
      })
    }
    for (const id of block.pages) pages.push({ id, section })
  }

  return { sections, pages }
}

export function reportOutline(model) {
  return reportPlan(model).sections
}

export function sectionNumber(outline, key) {
  return outline.find((item) => item.key === key)?.number || ''
}
