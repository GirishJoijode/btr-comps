import { grossReversionAmount, mean } from './calculations'
import {
  findLabel,
  findLabelWithValue,
  toNumber,
  toText,
} from '../parser/sheetHelpers'

const BED_LABELS = {
  0: 'Studio',
  1: '1 Bed',
  2: '2 Bed',
  3: '3 Bed',
  4: '4 Bed',
}

function bedLabel(type) {
  if (typeof type === 'number') return BED_LABELS[type] || `${type} Bed`
  const s = String(type).trim()
  if (s === '0' || /^studio$/i.test(s)) return 'Studio'
  return BED_LABELS[Number(s)] || s
}

function numbersAfter(rows, pos) {
  if (!pos) return []
  const row = rows[pos.r] || []
  const nums = []
  for (let c = pos.c + 1; c < row.length; c++) {
    const n = toNumber(row[c])
    if (n != null) nums.push(n)
  }
  return nums
}

function summaryLine(exec, label) {
  const start = findLabel(exec, 'INCOME SUMMARY')?.r ?? 0
  const end = findLabel(exec, 'MARKET RENT')?.r ?? exec.length
  const pos = findLabelWithValue(exec, label, { fromRow: start })
  if (!pos || pos.r >= end) return { amount: null, perSqFt: null, perUnit: null }
  const nums = numbersAfter(exec, pos)
  return { amount: nums[0] ?? null, perSqFt: nums[1] ?? null, perUnit: nums[2] ?? null }
}

function amountInSection(rows, label, fromRow) {
  const pos = findLabelWithValue(rows, label, { fromRow })
  return pos ? toNumber(pos.value) : null
}

export function readCurrentIncomeRates(exec) {
  const total = summaryLine(exec, 'Total')
  const net = summaryLine(exec, 'Net Income')
  return {
    grossPerSqFt: total.perSqFt,
    grossPerUnit: total.perUnit,
    netPerSqFt: net.perSqFt,
    netPerUnit: net.perUnit,
  }
}

export function parseRecentIncome(income) {
  const heading = findLabel(income, 'INCOME ANALYSIS AS OF')
  if (!heading) return null
  const periodLabel = toText(income[heading.r]?.[heading.c]) || toText(income[heading.r]?.[0])
  const rows = []
  for (let r = heading.r + 1; r < Math.min(income.length, heading.r + 12); r++) {
    const type = income[r]?.[0]
    if (type === '' || type == null) continue
    const raw = String(type).trim()
    if (/^type/i.test(raw)) continue
    const isTotal = /^total$/i.test(raw)
    if (!isTotal && typeof type !== 'number' && !/^\d+$/.test(raw)) continue
    const units = toNumber(income[r][1])
    const avgPcm = toNumber(income[r][4])
    const currentAvgPcm = toNumber(income[r][10])
    const live =
      isTotal ||
      (typeof units === 'number' && units !== 0) ||
      (typeof avgPcm === 'number' && avgPcm !== 0) ||
      (typeof currentAvgPcm === 'number' && currentAvgPcm !== 0)
    if (!live) continue
    rows.push({
      type: isTotal ? 'Total' : bedLabel(type),
      bedCode: isTotal ? null : type,
      units,
      minPcm: toNumber(income[r][2]),
      maxPcm: toNumber(income[r][3]),
      avgPcm,
      avgPsf: toNumber(income[r][5]),
      priorAvgPcm: toNumber(income[r][9]),
      currentAvgPcm,
      variancePcm: toNumber(income[r][11]),
      variancePct: toNumber(income[r][12]),
    })
    if (isTotal) break
  }
  return { periodLabel, rows }
}

export function parseMarketStatus(erv) {
  const heading = findLabel(erv, 'MARKET RENT ANALYSIS')
  if (!heading) return []
  const stop = findLabel(erv, 'NET MARKET RENT', { fromRow: heading.r + 1 })
  const end = stop ? stop.r : Math.min(erv.length, heading.r + 12)
  const out = []
  for (let r = heading.r + 1; r < end; r++) {
    const row = erv[r] || []
    const type = toText(row[1])
    const status = toText(row[2])
    if (!type && !status) continue
    let label = null
    if (/^residential total$/i.test(type || '')) label = 'Residential total'
    else if (/^ancillary$/i.test(type || '')) label = 'Ancillary'
    else if (/^total$/i.test(type || '')) label = 'Total'
    else if (/leased/i.test(status || '')) label = 'Residential leased'
    else if (/vacant/i.test(status || '')) label = 'Residential vacant'
    else continue
    out.push({
      label,
      units: toNumber(row[3]),
      areaSqFt: toNumber(row[4]),
      passingPa: toNumber(row[6]),
      passingPcm: toNumber(row[7]),
      passingPsf: toNumber(row[8]),
      marketPa: toNumber(row[9]),
      marketPcm: toNumber(row[10]),
      marketPsf: toNumber(row[11]),
      reversion: toNumber(row[12]),
    })
  }
  return out
}

const DEDUCTION = /void|bad debt|staff|building|amenity|tenancy|marketing|mgt|management|capex|cap-ex|budget capex|operating cost|lifecycle/i

export function parseErvAssessment(erv) {
  const start = findLabel(erv, 'GROSS ERV Assessment')
  if (!start) return []
  const items = []
  for (let r = start.r + 1; r < Math.min(erv.length, start.r + 26); r++) {
    const name = toText(erv[r]?.[1])
    if (!name || /^expenditure$/i.test(name)) continue
    const amount = toNumber(erv[r][3])
    const pct = toNumber(erv[r][5])
    if (amount == null && pct == null) continue
    let kind = 'line'
    if (/^net market rent$/i.test(name)) kind = 'result'
    else if (/^total|^noi$/i.test(name)) kind = 'subtotal'
    else if (DEDUCTION.test(name)) kind = 'deduction'
    items.push({
      name,
      amount,
      pct,
      perSqFt: toNumber(erv[r][6]),
      perUnit: toNumber(erv[r][7]),
      kind,
    })
  }
  return items
}

export function parseDetailBridge(exec) {
  const from = findLabel(exec, 'Net Market rent')?.r ?? 0
  const take = (label) => amountInSection(exec, label, from)
  return [
    { name: 'Gross ERV', amount: take('Gross ERV'), kind: 'total' },
    { name: 'Void allowance', amount: take('Void'), kind: 'deduction' },
    { name: 'Bad debt', amount: take('Bad Debt'), kind: 'deduction' },
    { name: 'Net after void and bad debt', amount: take('Total (net of bad deb'), kind: 'subtotal' },
    { name: 'Operating costs (incl. management)', amount: take('Operating Costs'), kind: 'deduction' },
    { name: 'Net income', amount: take('Net Income'), kind: 'subtotal' },
    { name: 'Lifecycle allowance', amount: take('Lifecycle Cost Allowance'), kind: 'deduction' },
    { name: 'Net market rent', amount: take('Net Income After Lifecycle allowance'), kind: 'result' },
  ].filter((row) => row.amount != null)
}

export function parseSummaryBridge(exec) {
  const heading = findLabel(exec, 'Net Market rent')
  if (!heading) return []
  const from = heading.r
  const take = (label) => amountInSection(exec, label, from)
  const gross = take('Gross ERV')
  const voidAllowance = take('Void')
  const badDebt = take('Bad Debt')
  const operating = take('Operating Costs')
  const lifecycle = take('Lifecycle Cost Allowance')
  const net = take('Net Income After Lifecycle allowance')
  return [
    { name: 'Gross ERV', amount: gross, kind: 'total' },
    { name: 'Void allowance', amount: voidAllowance, kind: 'deduction' },
    { name: 'Bad debt', amount: badDebt, kind: 'deduction' },
    { name: 'Operating costs (incl. management)', amount: operating, kind: 'deduction' },
    { name: 'Lifecycle allowance', amount: lifecycle, kind: 'deduction' },
    { name: 'Net market rent', amount: net, kind: 'result' },
  ].filter((row) => row.amount != null)
}

const BENCH_BEDS = [
  { type: '1 Bed', bedCode: 1, rent: 'bed1', psf: 'bed1Psf' },
  { type: '2 Bed', bedCode: 2, rent: 'bed2', psf: 'bed2Psf' },
  { type: '3 Bed', bedCode: 3, rent: 'bed3', psf: 'bed3Psf' },
]

export function buildRentalBenchmarks(evidence, unitTypes) {
  const schemes = (evidence || []).filter((row) => row && !row.isAverage && row.scheme)
  const beds = BENCH_BEDS.map((bed) => {
    const subject = (unitTypes || []).find((row) => row.bedCode === bed.bedCode || row.type === bed.type)
    const comparableRent = mean(schemes.map((row) => row[bed.rent]))
    const comparablePsf = mean(schemes.map((row) => row[bed.psf]))
    const subjectRent = subject?.ervPcm ?? null
    const subjectPsf = subject?.ervPsf ?? null
    return {
      type: bed.type,
      subjectRent,
      subjectPsf,
      comparableRent,
      comparablePsf,
      rentVariance:
        subjectRent != null && comparableRent != null ? subjectRent - comparableRent : null,
      psfVariance: subjectPsf != null && comparablePsf != null ? subjectPsf - comparablePsf : null,
    }
  })
  return {
    schemeCount: schemes.length,
    averageUnits: mean(schemes.map((row) => row.units)),
    studioRent: mean(schemes.map((row) => row.studio)),
    studioPsf: mean(schemes.map((row) => row.studioPsf)),
    beds,
  }
}

export function buildMarketRentExtras(exec, erv, evidence, unitTypes) {
  const status = parseMarketStatus(erv)
  const total = status.find((row) => row.label === 'Total')
  const assessment = parseErvAssessment(erv)
  const grossLine = assessment.find((row) => /^total$/i.test(row.name))
  const grossErv = amountInSection(exec, 'Gross ERV', findLabel(exec, 'Net Market rent')?.r ?? 0)
  const passing = total?.passingPa ?? null
  return {
    status,
    summaryBridge: parseSummaryBridge(exec),
    detailBridge: parseDetailBridge(exec),
    grossToNet: assessment.find((row) => /gross to net/i.test(row.name))?.amount ?? null,
    assessment,
    grossErvPerSqFt: grossLine?.perSqFt ?? null,
    reversionPct: total?.reversion ?? null,
    reversionAmount: grossReversionAmount(grossErv ?? total?.marketPa ?? null, passing),
    leakageIncVoids: amountInSection(erv, 'Leakage inc voids', findLabel(erv, 'NET MARKET RENT')?.r ?? 0),
    benchmarks: buildRentalBenchmarks(evidence, unitTypes),
  }
}
