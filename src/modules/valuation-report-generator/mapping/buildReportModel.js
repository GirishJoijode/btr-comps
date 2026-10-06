import { excelValueToDateParts, formatIsoDateStamp, formatUkLongDate } from '../parser/excelDates'
import { usableImage } from '../utils/formatters'
import { buildMarketRentExtras, parseRecentIncome, readCurrentIncomeRates } from './extendModel'
import { parseCashflow, parseFurtherInfo, parseIncomeStatement, parseYieldProfile } from './phase3'
import {
  cell,
  findExactLabel,
  findLabel,
  findLabelWithValue,
  labelledNumber,
  labelledText,
  makeRowReader,
  toNumber,
  toText,
  valueRight,
} from '../parser/sheetHelpers'

const BED_LABELS = {
  0: 'Studio',
  1: '1 Bed',
  2: '2 Bed',
  3: '3 Bed',
  4: '4 Bed',
}

function bedLabel(type) {
  if (type == null) return null
  if (typeof type === 'number') return BED_LABELS[type] || `${type} Bed`
  const s = String(type).trim()
  if (s === '0' || /^studio$/i.test(s)) return 'Studio'
  return BED_LABELS[Number(s)] || s
}

function findAccommodation(exec) {
  const pos = findLabel(exec, 'Accommodation')
  if (!pos) return { areaSqFt: null, units: null, averageUnitSize: null }
  const next = exec[pos.r + 1] || []
  return {
    areaSqFt: toNumber(next[2] ?? next[pos.c + 1]),
    units: toNumber(next[3] ?? next[pos.c + 2]),
    averageUnitSize: toNumber(next[4] ?? next[pos.c + 3]),
  }
}

function yieldFromExec(exec) {
  const mvBlock = findLabel(exec, 'MARKET VALUE')
  const start = mvBlock ? mvBlock.r : 0
  const initialRow = findLabel(exec, 'Initial', { fromRow: start })
  const equivRow = findLabel(exec, 'True Equivalent', { fromRow: start })
  const revRow = findLabel(exec, 'Reversionary', { fromRow: start })
  const irrRow = findExactLabel(exec, 'IRR', { fromRow: start }) || findLabel(exec, 'IRR', { fromRow: start })
  const psfRow = findLabel(exec, '£ per sq ft', { fromRow: start })

  const lastNum = (pos) => {
    if (!pos) return null
    const row = exec[pos.r] || []
    for (let c = row.length - 1; c > pos.c; c--) {
      const n = toNumber(row[c])
      if (n != null) return n
    }
    return null
  }

  return {
    netInitialYield: lastNum(initialRow),
    equivalentYield: lastNum(equivRow),
    reversionaryYield: lastNum(revRow),
    irr: lastNum(irrRow),
    valuePerSqFt: lastNum(psfRow),
  }
}

function parseIncomeByUnitType(income) {
  const heading = findLabel(income, 'INCOME ANALYSIS - OVERALL')
  if (!heading) return []
  const rows = []
  for (let r = heading.r + 2; r < Math.min(income.length, heading.r + 12); r++) {
    const type = income[r]?.[0]
    if (type === '' || type == null) continue
    const label = String(type).trim()
    if (/^car parking|^pets|^total$/i.test(label)) {
      if (/^total$/i.test(label)) {
        rows.push({
          type: 'Total',
          units: toNumber(income[r][1]),
          areaSqFt: toNumber(income[r][2]),
          letAreaSqFt: toNumber(income[r][3]),
          incomePa: toNumber(income[r][4]),
          minPcm: toNumber(income[r][6]),
          maxPcm: toNumber(income[r][8]),
          avgPcm: toNumber(income[r][10]),
          avgPsf: toNumber(income[r][12]),
        })
      }
      break
    }
    rows.push({
      type: bedLabel(type),
      bedCode: type,
      units: toNumber(income[r][1]),
      areaSqFt: toNumber(income[r][2]),
      letAreaSqFt: toNumber(income[r][3]),
      incomePa: toNumber(income[r][4]),
      minPcm: toNumber(income[r][6]),
      maxPcm: toNumber(income[r][8]),
      avgPcm: toNumber(income[r][10]),
      avgPsf: toNumber(income[r][12]),
    })
  }
  return rows
}

function parseCostCategories(income) {
  const heading = findLabel(income, 'Cost Summary') || findLabel(income, 'RUNNING COSTS')
  if (!heading) return []
  const start = findLabel(income, 'Staff', { fromRow: heading.r }) || heading
  const cats = []
  for (let r = start.r; r < Math.min(income.length, start.r + 16); r++) {
    const name = toText(income[r]?.[0])
    if (!name) continue
    const cost = toNumber(income[r][1])
    if (cost == null && !/^total|^net income|^sub-total/i.test(name)) continue
    cats.push({
      name,
      costPa: cost,
      pctOfIncome: toNumber(income[r][2]),
      perSqFt: toNumber(income[r][3]),
      perUnit: toNumber(income[r][4]),
    })
    if (/^total$/i.test(name)) {
      const nextName = toText(income[r + 1]?.[0])
      if (nextName && /^net income$/i.test(nextName)) {
        const next = income[r + 1]
        cats.push({
          name: nextName,
          costPa: toNumber(next[1]),
          pctOfIncome: toNumber(next[2]),
          perSqFt: toNumber(next[3]),
          perUnit: toNumber(next[4]),
        })
      }
      break
    }
  }
  return cats
}

function findOccupiedUnits(income) {
  const letting = findLabel(income, 'LETTING PROFILE')
  if (!letting) return null
  const occ = findExactLabel(income, 'Occupancy', { fromRow: letting.r })
  if (!occ) return null
  const row = income[occ.r] || []
  return toNumber(row[9]) ?? toNumber(row[occ.c + 3]) ?? toNumber(row[occ.c + 1])
}

function parseErvByUnitType(erv) {
  const heading = findLabel(erv, 'BY BED')
  if (!heading) return []
  const rows = []
  for (let r = heading.r + 1; r < Math.min(erv.length, heading.r + 14); r++) {
    const type = erv[r]?.[1]
    if (type === '' || type == null) continue
    const label = String(type).trim()
    if (/^type/i.test(label)) continue
    if (/^car parking|^pets|^total$/i.test(label)) break
    if (typeof type !== 'number' && !/^\d+$/.test(label)) continue
    rows.push({
      type: bedLabel(type),
      bedCode: type,
      units: toNumber(erv[r][2]),
      areaSqFt: toNumber(erv[r][3]),
      passingPa: toNumber(erv[r][5]),
      avgPcm: toNumber(erv[r][6]),
      avgPsfLet: toNumber(erv[r][7]),
      ervPa: toNumber(erv[r][8]),
      ervPcm: toNumber(erv[r][11]),
      ervPsf: toNumber(erv[r][12]),
      reversion: toNumber(erv[r][13]),
    })
  }
  return rows
}

function parseRentalEvidence(evidence) {
  if (!evidence) return []
  const header = findLabel(evidence, 'Scheme')
  if (!header) return []
  const out = []
  for (let r = header.r + 1; r < evidence.length; r++) {
    const row = evidence[r] || []
    const scheme = toText(row[0])
    if (!scheme) continue
    if (/^average$/i.test(scheme)) {
      out.push({
        scheme: 'Average',
        town: null,
        operator: null,
        amenities: null,
        units: toNumber(row[4]),
        launched: toText(row[5]),
        studio: toNumber(row[6]),
        studioPsf: toNumber(row[7]),
        bed1: toNumber(row[8]),
        bed1Psf: toNumber(row[9]),
        bed2: toNumber(row[10]),
        bed2Psf: toNumber(row[11]),
        bed3: toNumber(row[12]),
        bed3Psf: toNumber(row[13]),
        isAverage: true,
      })
      continue
    }
    out.push({
      scheme,
      town: toText(row[1]),
      operator: toText(row[2]),
      amenities: toText(row[3]),
      units: toNumber(row[4]),
      launched: toText(row[5]),
      studio: toNumber(row[6]),
      studioPsf: toNumber(row[7]),
      bed1: toNumber(row[8]),
      bed1Psf: toNumber(row[9]),
      bed2: toNumber(row[10]),
      bed2Psf: toNumber(row[11]),
      bed3: toNumber(row[12]),
      bed3Psf: toNumber(row[13]),
      isAverage: false,
    })
  }
  return out
}

function investmentHasRows(rows) {
  if (!rows) return false
  const header = findLabel(rows, 'Property')
  const start = header ? header.r + 1 : 1
  for (let r = start; r < rows.length; r++) {
    const name = toText(rows[r]?.[0])
    if (name && !/^property$/i.test(name)) return true
  }
  return false
}

export function buildReportModel(workbook, XLSX, { propertyImage = null, additionalImages = [] } = {}) {
  const rowsFor = makeRowReader(XLSX)
  const exec = rowsFor(workbook, 'EXECUTIVE SUMMARY')
  const prop = rowsFor(workbook, 'Property Summary')
  const income = rowsFor(workbook, 'Income Report')
  const erv = rowsFor(workbook, 'ERV Report')
  const evidence = rowsFor(workbook, 'Rental Evidence')
  const investmentRows = rowsFor(workbook, 'Investment Evidence')
  const valuationRows = rowsFor(workbook, 'Val Summary - Existing')

  const accommodation = findAccommodation(exec)
  const yields = yieldFromExec(exec)
  const datePos =
    findLabelWithValue(exec, 'Valuation Date') || findLabelWithValue(income, 'Date of Valuation')
  const dateParts = excelValueToDateParts(datePos?.value)

  const occupancy = labelledNumber(exec, 'Occupancy') ?? labelledNumber(income, 'Occupancy')
  const units = accommodation.units
  const occupied =
    findOccupiedUnits(income) ??
    (units != null && occupancy != null ? Math.round(units * occupancy) : null)

  const marketValue = labelledNumber(exec, 'Market Value')
  const rentalIncome = labelledNumber(exec, 'Rental Income')
  const ancillaryIncome = labelledNumber(exec, 'Ancillary Income')
  const grossIncome = labelledNumber(exec, 'Total')
  const badDebt = labelledNumber(exec, 'Bad Debt')
  const netOfBadDebt = labelledNumber(exec, 'Total (net of bad debt)')
  const totalCosts = labelledNumber(exec, 'Total Costs')
  const netIncome = labelledNumber(exec, 'Net Income')
  const grossToNet = labelledNumber(exec, 'Gross to Net Pre Mgmt Fee & Cap-ex')

  const grossErv =
    labelledNumber(erv, 'Gross ERV') ??
    labelledNumber(exec, 'Gross ERV') ??
    toNumber(valueRight(exec, findLabel(exec, 'TOTAL')))

  const execTotalRow = (() => {
    const pos = findExactLabel(exec, 'TOTAL') || findLabel(exec, 'TOTAL')
    if (!pos) return {}
    const row = exec[pos.r] || []
    return { passing: toNumber(row[6]), erv: toNumber(row[9]), reversion: toNumber(row[12]) }
  })()

  const netErv =
    labelledNumber(erv, 'Net Market Rent') ?? labelledNumber(exec, 'Net Income After Lifecycle allowance')

  const ervVacant = labelledNumber(income, 'ERV of vacant space')
  const lettings12m = labelledNumber(income, 'Lettings - last 12 months')
  const avgStay = labelledNumber(income, 'Average Stay Legnth of Occupancy as of Today')
  const incomePsfLet = labelledNumber(income, 'Income £ per sq ft (on let space)')
  const incomeGrowth = labelledNumber(income, 'Income Growth (last 5 months)')

  const costCats = parseCostCategories(income)
  const totalCat = costCats.find((c) => /^total$/i.test(c.name))
  const incomeRates = readCurrentIncomeRates(exec)
  const rentalEvidence = parseRentalEvidence(evidence)
  const ervByUnitType = parseErvByUnitType(erv)
  const marketExtras = buildMarketRentExtras(exec, erv, rentalEvidence, ervByUnitType)
  const recentIncome = parseRecentIncome(income)
  const incomeByUnitType = parseIncomeByUnitType(income)
  const averageRentPcm = incomeByUnitType.find((row) => row.type === 'Total')?.avgPcm ?? null

  const leased = findLabel(exec, 'Leased')
  const vacant = findLabel(exec, 'Vacant')

  return {
    meta: {
      propertyName: labelledText(exec, 'Property') || labelledText(prop, 'Property'),
      location: labelledText(exec, 'Location') || labelledText(prop, 'Location'),
      subSector: labelledText(exec, 'Sub-Sector') || labelledText(prop, 'Sub-Sector'),
      valuationDate: formatUkLongDate(dateParts),
      valuationDateParts: dateParts,
      valuationDateStamp: formatIsoDateStamp(dateParts),
    },
    property: {
      operator: labelledText(exec, 'Operator') || labelledText(prop, 'Operator'),
      units,
      areaSqFt: accommodation.areaSqFt,
      averageUnitSize: accommodation.averageUnitSize,
      yearBuilt: labelledNumber(exec, 'Year of Construction') ?? labelledNumber(prop, 'Year of completion'),
      yearModernised: labelledText(exec, 'Year of Modernisation') || labelledText(prop, 'Year of Modernisation'),
      tenure: labelledText(exec, 'Tenure') || labelledText(prop, 'Tenure'),
      affordable: labelledText(exec, 'Affordable'),
      storeys: labelledNumber(prop, 'Height (Max Storeys)'),
      carParking: labelledNumber(prop, 'Car Parking'),
    },
    valuation: {
      marketValue,
      valuePerSqFt: yields.valuePerSqFt,
      netInitialYield: yields.netInitialYield,
      equivalentYield: yields.equivalentYield,
      reversionaryYield: yields.reversionaryYield,
      irr: yields.irr,
      lessCostOfWorks: labelledNumber(exec, 'Less Cost of Works'),
      netValue: labelledNumber(exec, 'Net Value'),
    },
    currentIncome: {
      rentalIncome,
      ancillaryIncome,
      grossIncome,
      badDebt,
      netOfBadDebt,
      netIncome,
      occupancy,
      occupiedUnits: occupied,
      ervVacantSpace: ervVacant,
      lettingMetrics: {
        lettingsLast12Months: lettings12m,
        averageStayMonths: avgStay,
        incomePsfOnLetSpace: incomePsfLet,
        incomeGrowthLast5Months: incomeGrowth,
        costsPerUnit: labelledNumber(income, 'Costs £ per unit'),
        costsPctOfIncome: labelledNumber(income, 'Costs % of income'),
        costsPctOfErv: labelledNumber(income, 'Costs as % of ERV'),
      },
      grossToNet,
      grossPerSqFt: incomeRates.grossPerSqFt,
      grossPerUnit: incomeRates.grossPerUnit,
      perSqFt: incomeRates.netPerSqFt,
      perUnit: incomeRates.netPerUnit,
      statement: parseIncomeStatement(exec),
      averageRentPcm,
    },
    recentIncome,
    incomeByUnitType,
    operatingCosts: {
      total: totalCosts ?? totalCat?.costPa ?? null,
      perSqFt: totalCat?.perSqFt ?? null,
      perUnit: totalCat?.perUnit ?? null,
      ratio: totalCat?.pctOfIncome ?? null,
      grossToNet,
      categories: costCats,
    },
    marketRent: {
      grossErv: grossErv ?? execTotalRow.erv,
      grossErvPerSqFt: marketExtras.grossErvPerSqFt,
      reversion: marketExtras.reversionPct ?? execTotalRow.reversion,
      reversionAmount: marketExtras.reversionAmount,
      netErv,
      leakage: labelledNumber(erv, 'Leakage'),
      leakageIncVoids: marketExtras.leakageIncVoids,
      status: marketExtras.status,
      summaryBridge: marketExtras.summaryBridge,
      detailBridge: marketExtras.detailBridge,
      grossToNet: marketExtras.grossToNet,
      assessment: marketExtras.assessment,
      leasedUnits: leased ? toNumber(cell(exec, leased.r, leased.c + 1)) : null,
      vacantUnits: vacant ? toNumber(cell(exec, vacant.r, vacant.c + 1)) : null,
      leased: leased
        ? {
            units: toNumber(exec[leased.r]?.[3]),
            areaSqFt: toNumber(exec[leased.r]?.[4]),
            passingPa: toNumber(exec[leased.r]?.[6]),
            ervPa: toNumber(exec[leased.r]?.[9]),
          }
        : null,
      vacant: vacant
        ? {
            units: toNumber(exec[vacant.r]?.[3]),
            areaSqFt: toNumber(exec[vacant.r]?.[4]),
            ervPa: toNumber(exec[vacant.r]?.[9]),
          }
        : null,
      unitTypes: ervByUnitType,
    },
    rentalEvidence,
    rentalBenchmarks: marketExtras.benchmarks,
    investment: {
      included: false,
      evidenceRows: investmentHasRows(investmentRows),
      reason: investmentHasRows(investmentRows)
        ? 'Investment evidence rows were found but this report version does not yet render that section.'
        : 'Investment comparables omitted — the Investment Evidence sheet has no transactions.',
    },
    yieldProfile: parseYieldProfile(exec),
    cashflow: parseCashflow(valuationRows),
    furtherInfo: parseFurtherInfo(prop),
    images: {
      propertyImage: usableImage(propertyImage?.dataUrl),
      additional: (additionalImages || []).map((image) => usableImage(image?.dataUrl)).filter(Boolean),
    },
  }
}
