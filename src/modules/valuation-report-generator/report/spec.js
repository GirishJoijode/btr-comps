import { reportPlan, activeBenchmarkBeds } from '../pdf/outline'
import {
  dash,
  isMissing,
  isReportedUnitRow,
  isValidNumber,
  millions,
  money,
  money2,
  number,
  percent,
  variancePhrase,
} from '../utils/formatters'

/**
 * Shared report specification.
 * Both the PowerPoint renderer and the PDF document consume this slide list,
 * built from the same report model and the same section eligibility rules.
 */

const WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']

function shown(value) {
  return value != null && value !== '' && value !== '—'
}

function pairs(entries) {
  return entries
    .filter(([, value]) => shown(value))
    .map(([label, value]) => [label, String(value)])
}

function table(title, headers, rows, options = {}) {
  return {
    title,
    headers,
    rows,
    aligns: options.aligns || headers.map((_, index) => (index === 0 ? 'left' : 'right')),
    emphasis: options.emphasis || [],
  }
}

function countWord(n) {
  if (!n) return 'the'
  return WORDS[n - 1] || String(n)
}

function incomeAmount(row) {
  if (row.ratio) return percent(row.amount, 1)
  return money(row.amount)
}

function chartNumber(value) {
  return isValidNumber(value) ? value : null
}

function uniqueSeriesName(name, used) {
  const base = name || 'Series'
  let next = base
  let index = 2
  while (used.has(next)) next = `${base} (${index++})`
  used.add(next)
  return next
}

function benchmarkChart(model, psf) {
  const bench = model.rentalBenchmarks || { beds: [], schemeCount: 0 }
  const beds = activeBenchmarkBeds(model).filter((bed) =>
    psf
      ? isValidNumber(bed.subjectPsf) || isValidNumber(bed.comparablePsf)
      : isValidNumber(bed.subjectRent) || isValidNumber(bed.comparableRent),
  )
  const schemes = (model.rentalEvidence || []).filter((row) => row && !row.isAverage && row.scheme)
  const fieldFor = (bed) => {
    if (bed.type === '1 Bed') return psf ? 'bed1Psf' : 'bed1'
    if (bed.type === '2 Bed') return psf ? 'bed2Psf' : 'bed2'
    if (bed.type === '3 Bed') return psf ? 'bed3Psf' : 'bed3'
    return null
  }
  const categories = beds.map((bed) => bed.type)
  const used = new Set()
  const subjectName = uniqueSeriesName(model.meta.propertyName || 'Subject', used)
  const series = [
    {
      name: subjectName,
      values: beds.map((bed) => chartNumber(psf ? bed.subjectPsf : bed.subjectRent)),
    },
    ...schemes.map((row) => ({
      name: uniqueSeriesName(row.scheme, used),
      values: beds.map((bed) => chartNumber(row[fieldFor(bed)])),
    })),
    {
      name: uniqueSeriesName('Average', used),
      values: beds.map((bed) => chartNumber(psf ? bed.comparablePsf : bed.comparableRent)),
    },
  ]
  const cards = beds.map((bed, index) => {
    const subject = psf ? bed.subjectPsf : bed.subjectRent
    const comparable = psf ? bed.comparablePsf : bed.comparableRent
    const variance = psf ? bed.psfVariance : bed.rentVariance
    return {
      label: bed.type,
      value: psf ? money2(subject) : money(subject),
      sub: isValidNumber(subject) && isValidNumber(comparable) ? variancePhrase(variance, psf ? 2 : 0) : '',
      dark: index === 0,
    }
  }).filter((card) => shown(card.value))
  const place = model.meta.location ? `${model.meta.location} ` : ''
  const noun = bench.schemeCount === 1 ? 'scheme' : 'schemes'
  return {
    cards,
    note: `Subject market ${psf ? '£ per sq ft' : 'rent'} shown alongside the ${countWord(bench.schemeCount)} ${place}evidence ${noun}. Blank bedrooms stay blank and are left out of that average.`,
    chart: beds.length && schemes.length
      ? {
          type: 'bar',
          grouping: 'clustered',
          direction: 'col',
          categories,
          series,
          format: psf ? '£#,##0.00' : '£#,##0',
          axisTitle: psf ? '£ per sq ft' : '£ per month',
        }
      : null,
  }
}

function evidenceColumns(schemes) {
  const fields = [
    { type: 'Studio', rent: 'studio', psf: 'studioPsf' },
    { type: '1 Bed', rent: 'bed1', psf: 'bed1Psf' },
    { type: '2 Bed', rent: 'bed2', psf: 'bed2Psf' },
    { type: '3 Bed', rent: 'bed3', psf: 'bed3Psf' },
  ]
  return fields.filter((field) => schemes.some((row) => row[field.rent] != null || row[field.psf] != null))
}

function rentCell(value, psf) {
  if (value == null || !isValidNumber(value)) return '—'
  return psf ? money2(value) : money(value)
}

function compose(page, model) {
  const section = page.section || ''
  const base = {
    id: page.id,
    section,
    kicker: page.kicker || '',
    title: page.title || '',
    lede: page.lede || '',
    image: page.image || null,
    imageCaption: '',
    cards: [],
    facts: [],
    tables: [],
    note: '',
    chart: null,
    layout: 'content',
  }

  if (page.id === 'cover') {
    const { meta } = model
    return {
      ...base,
      layout: 'cover',
      kicker: 'VALUATION SUMMARY REPORT',
      title: dash(meta.propertyName),
      lede: [meta.location, meta.subSector].filter(Boolean).join('  |  ') || '—',
      note: `Valuation date  ${dash(meta.valuationDate)}`,
    }
  }

  if (page.id === 'contents') {
    return { ...base, layout: 'contents', kicker: 'CONTENTS', title: dash(model.meta.propertyName) }
  }

  if (page.id === 'divider') {
    return {
      ...base,
      layout: 'divider',
      imageCaption: [model.meta.propertyName, model.meta.location].filter(Boolean).join(', '),
    }
  }

  if (page.id === 'exec') {
    const { valuation, property, currentIncome, marketRent, meta } = model
    const cards = [
      {
        label: 'Market value',
        value: money(valuation.marketValue, { compact: true }),
        sub: shown(money2(valuation.valuePerSqFt)) ? `${money2(valuation.valuePerSqFt)} per sq ft` : '',
        dark: true,
      },
      ['Equivalent yield', percent(valuation.equivalentYield, 2)],
      ['Reversionary yield (triple net)', percent(valuation.reversionaryYield, 2)],
      ['Initial yield (triple net)', percent(valuation.netInitialYield, 2)],
      ['IRR', percent(valuation.irr, 2)],
    ]
      .map((item) => (Array.isArray(item) ? { label: item[0], value: item[1], sub: '', dark: false } : item))
      .filter((item) => shown(item.value))
    const facts = pairs([
      ['Area', sqftSafe(property.areaSqFt)],
      ['Units', number(property.units)],
      ['Occupancy', percent(currentIncome.occupancy, 1)],
      ['Average unit size', sqftSafe(property.averageUnitSize)],
      ['Current net income', money(currentIncome.netIncome, { compact: true })],
      ['Current gross income', money(currentIncome.grossIncome, { compact: true })],
      ['Net ERV', money(marketRent.netErv, { compact: true })],
      ['Gross ERV', money(marketRent.grossErv, { compact: true })],
      ['Year built', dash(property.yearBuilt)],
      ['Tenure', dash(property.tenure)],
      ['Operator', dash(property.operator)],
      ['Valuation date', dash(meta.valuationDate)],
    ])
    return {
      ...base,
      layout: 'exec',
      kicker: `${section}  Executive summary`,
      title: dash(meta.propertyName),
      cards,
      facts,
    }
  }

  if (page.id === 'property') {
    const { property, meta } = model
    const rows = pairs([
      ['Property', meta.propertyName],
      ['Location', meta.location],
      ['Sub-sector', meta.subSector],
      ['Operator', property.operator],
      ['Units', number(property.units)],
      ['Area', sqftSafe(property.areaSqFt)],
      ['Average unit size', sqftSafe(property.averageUnitSize)],
      ['Year of construction', property.yearBuilt],
      ['Year of modernisation', property.yearModernised],
      ['Tenure', property.tenure],
      ['Affordable', property.affordable],
    ])
    return {
      ...base,
      layout: 'property',
      kicker: `${section}  Property overview`,
      title: 'Asset profile',
      image: model.images?.propertyImage || null,
      imageCaption: [meta.propertyName, meta.location].filter(Boolean).join(', '),
      tables: [table('PROPERTY / ASSET PROFILE', ['', ''], rows, { aligns: ['left', 'right'] })],
    }
  }

  if (page.id === 'income') {
    const inc = model.currentIncome || {}
    const rows = (inc.statement || []).map((row) => [
      row.name,
      incomeAmount(row),
      row.ratio ? '—' : money2(row.perSqFt),
      row.ratio ? '—' : money(row.perUnit),
    ])
    const emphasis = (inc.statement || [])
      .map((row, index) => (row.name === 'Total' || row.name === 'Net income' ? index : -1))
      .filter((index) => index >= 0)
    return {
      ...base,
      kicker: `${section}  Income summary`,
      title: 'Current passing income',
      cards: [
        { label: 'Gross income', value: money(inc.grossIncome, { compact: true }), sub: shown(money2(inc.grossPerSqFt)) ? `${money2(inc.grossPerSqFt)} per sq ft` : '', dark: true },
        { label: 'Net income', value: money(inc.netIncome, { compact: true }), sub: shown(money2(inc.perSqFt)) ? `${money2(inc.perSqFt)} per sq ft` : '', dark: false },
        { label: 'Average rent', value: money(inc.averageRentPcm), sub: 'pcm, current passing', dark: false },
        { label: 'Gross to net', value: percent(inc.grossToNet, 1), sub: 'pre management fee and cap-ex', dark: false },
      ].filter((card) => shown(card.value)),
      tables: [table('INCOME SUMMARY', ['', '£', '£ per sq ft', '£ per flat'], rows, { emphasis })],
    }
  }

  if (page.id === 'letting') {
    const inc = model.currentIncome || {}
    const letm = inc.lettingMetrics || {}
    const rows = pairs([
      ['Date of valuation', dash(model.meta.valuationDate)],
      ['Income', money(inc.grossIncome)],
      ['Occupancy', percent(inc.occupancy, 1)],
      ['ERV of vacant space', money(inc.ervVacantSpace)],
      ['Lettings — last 12 months', percent(letm.lettingsLast12Months, 1)],
      ['Average stay (months)', number(letm.averageStayMonths, 1)],
      ['Income £ per sq ft (let space)', money2(letm.incomePsfOnLetSpace)],
      ['Income growth (last 5 months)', percent(letm.incomeGrowthLast5Months, 1)],
      ['Costs £ per unit', money2(letm.costsPerUnit)],
      ['Costs % of income', percent(letm.costsPctOfIncome, 1)],
      ['Costs as % of ERV', percent(letm.costsPctOfErv, 1)],
    ])
    return {
      ...base,
      kicker: `${section}  Income summary`,
      title: 'Letting profile',
      cards: [
        {
          label: 'Occupancy',
          value: percent(inc.occupancy, 1),
          sub: inc.occupiedUnits != null ? `${number(inc.occupiedUnits)} occupied units` : '',
          dark: true,
        },
        { label: 'Lettings last 12 months', value: percent(letm.lettingsLast12Months, 1), sub: '', dark: false },
        { label: 'Average stay', value: number(letm.averageStayMonths, 1), sub: 'months', dark: false },
      ].filter((card) => shown(card.value)),
      tables: [table('LETTING PROFILE', ['', ''], rows, { aligns: ['left', 'right'] })],
    }
  }

  if (page.id === 'analysis') {
    const rows = (model.incomeByUnitType || []).filter(isReportedUnitRow)
    const recent = model.recentIncome
    const cards = (recent?.rows || [])
      .filter((row) => row.type !== 'Total' && !isMissing(row.currentAvgPcm))
      .map((row) => ({
        label: row.type,
        value: money(row.currentAvgPcm),
        sub: `Prior ${money(row.priorAvgPcm)}   ·   ${money2(row.variancePcm)}   ·   ${percent(row.variancePct, 1)}`,
        dark: false,
      }))
      .filter((card) => shown(card.value))
    return {
      ...base,
      kicker: `${section}  Income analysis`,
      title: 'Unit mix — current passing rent',
      note: cards.length
        ? `${recent?.periodLabel || 'Recent lettings'} — current-period average versus the prior period, as stated in the workbook.`
        : '',
      cards,
      tables: [
        table(
          'INCOME ANALYSIS — OVERALL',
          ['Type', 'Units', 'Sq ft', 'Let sq ft', '£ pa', 'Min pcm', 'Max pcm', 'Avg pcm', '£ psf'],
          rows.map((row) => [
            dash(row.type),
            number(row.units),
            number(row.areaSqFt),
            number(row.letAreaSqFt),
            money(row.incomePa),
            money(row.minPcm),
            money(row.maxPcm),
            money(row.avgPcm),
            money2(row.avgPsf),
          ]),
          { emphasis: rows.map((row, index) => (row.type === 'Total' ? index : -1)).filter((index) => index >= 0) },
        ),
      ],
    }
  }

  if (page.id === 'costs') {
    const costs = model.operatingCosts || {}
    const cats = (costs.categories || []).filter(
      (row) => row.costPa != null || row.pctOfIncome != null || row.perSqFt != null || row.perUnit != null,
    )
    return {
      ...base,
      kicker: `${section}  Operating costs`,
      title: 'Current running costs',
      cards: [
        { label: 'Total costs', value: money(costs.total, { compact: true }), sub: '', dark: true },
        { label: 'Cost ratio', value: percent(costs.ratio, 1), sub: 'of income net of bad debt', dark: false },
        { label: '£ per flat', value: money2(costs.perUnit), sub: '', dark: false },
        { label: '£ per sq ft', value: money2(costs.perSqFt), sub: '', dark: false },
      ].filter((card) => shown(card.value)),
      tables: [
        table(
          'COST SUMMARY — CURRENT / PASSING',
          ['Cost category', 'Cost pa', '% of income', '£ psf', '£ per unit'],
          cats.map((row) => [
            dash(row.name),
            money(row.costPa),
            percent(row.pctOfIncome, 1),
            row.perSqFt != null ? money2(row.perSqFt) : '—',
            row.perUnit != null ? money2(row.perUnit) : '—',
          ]),
          {
            emphasis: cats
              .map((row, index) => (/^(total|sub[-\s]?total|net income)$/i.test(row.name) ? index : -1))
              .filter((index) => index >= 0),
          },
        ),
      ],
    }
  }

  if (page.id === 'marketSummary') {
    const rent = model.marketRent || {}
    const types = (rent.unitTypes || []).filter(isReportedUnitRow)
    const residential = (rent.status || []).find((row) => row.label === 'Residential total')
    const leftRows = types.map((row) => [
      dash(row.type),
      number(row.units),
      money(row.passingPa),
      money(row.ervPa),
      money(row.ervPcm),
      percent(row.reversion, 1),
    ])
    if (residential) {
      leftRows.push([
        residential.label,
        number(residential.units),
        money(residential.passingPa),
        money(residential.marketPa),
        money(residential.marketPcm),
        percent(residential.reversion, 1),
      ])
    }
    const bridge = (rent.summaryBridge || []).map((row) => [
      row.name,
      row.kind === 'deduction' ? `−${money(row.amount)}` : money(row.amount),
    ])
    bridge.push(['Gross to net (ERV)', percent(rent.grossToNet, 1)])
    return {
      ...base,
      layout: 'split',
      kicker: `${section}  Market rent summary`,
      title: 'ERV assessment',
      cards: [
        { label: 'Gross ERV', value: money(rent.grossErv, { compact: true }), sub: shown(money2(rent.grossErvPerSqFt)) ? `${money2(rent.grossErvPerSqFt)} per sq ft` : '', dark: true },
        { label: 'Gross reversion', value: percent(rent.reversion, 2), sub: money(rent.reversionAmount, { compact: true }), dark: false },
        { label: 'Net ERV', value: money(rent.netErv, { compact: true }), sub: 'after lifecycle allowance', dark: false },
        { label: 'Leakage', value: percent(rent.leakage, 1), sub: 'workbook ERV leakage', dark: false },
      ].filter((card) => shown(card.value)),
      tables: [
        table(
          'GROSS MARKET RENT BY UNIT TYPE',
          ['Type', 'Units', 'Passing pa', 'Market pa', 'Avg pcm', 'Reversion'],
          leftRows,
          {
            emphasis: leftRows
              .map((row, index) => (row[0] === 'Total' || row[0] === 'Residential total' ? index : -1))
              .filter((index) => index >= 0),
          },
        ),
        table('NET MARKET RENT BRIDGE', ['', ''], bridge, { aligns: ['left', 'right'] }),
      ],
    }
  }

  if (page.id === 'runningCosts') {
    const rent = model.marketRent || {}
    const voidRow = (rent.assessment || []).find((row) => /^void$/i.test(row.name))
    const rows = (rent.assessment || []).filter((row) => !/gross to net|^leakage/i.test(row.name))
    const netRow = (rent.assessment || []).find((row) => /^net market rent$/i.test(row.name))
    return {
      ...base,
      kicker: `${section}  Market rent`,
      title: 'Running costs and net market rent',
      cards: [
        { label: 'Gross ERV', value: money(rent.grossErv, { compact: true }), sub: '', dark: true },
        { label: 'Void allowance', value: money(voidRow?.amount), sub: percent(voidRow?.pct, 2), dark: false },
        {
          label: 'Net market rent',
          value: money(rent.netErv, { compact: true }),
          sub: shown(money2(netRow?.perSqFt)) ? `${money2(netRow.perSqFt)} per sq ft` : '',
          dark: false,
        },
        { label: 'Gross to net', value: percent(rent.grossToNet, 1), sub: 'pre management fee and cap-ex', dark: false },
      ].filter((card) => shown(card.value)),
      tables: [
        table(
          'GROSS ERV ASSESSMENT — MARKET RENT, NOT CURRENT COSTS',
          ['', '£', '%', '£ per sq ft', '£ per unit'],
          rows.map((row) => [dash(row.name), money(row.amount), percent(row.pct, 1), money2(row.perSqFt), money(row.perUnit)]),
          {
            emphasis: rows
              .map((row, index) => (row.kind === 'subtotal' || row.kind === 'result' || row.kind === 'total' ? index : -1))
              .filter((index) => index >= 0),
          },
        ),
      ],
    }
  }

  if (page.id === 'evidence') {
    const bench = model.rentalBenchmarks || {}
    const schemes = (model.rentalEvidence || []).filter((row) => row && !row.isAverage && row.scheme)
    const columns = evidenceColumns(schemes)
    const bed = (type) => (bench.beds || []).find((row) => row.type === type)
    const average = { scheme: 'Average', operator: null, units: bench.averageUnits, launched: null, derived: true }
    for (const field of columns) {
      if (field.type === 'Studio') {
        average[field.rent] = bench.studioRent
        average[field.psf] = bench.studioPsf
      } else {
        average[field.rent] = bed(field.type)?.comparableRent
        average[field.psf] = bed(field.type)?.comparablePsf
      }
    }
    const headers = ['Scheme', 'Operator', 'Units', 'Launch', ...columns.flatMap((field) => [field.type, '£psf'])]
    const body = [...schemes, average].map((row) => [
      dash(row.scheme),
      dash(row.operator),
      number(row.units, 0),
      dash(row.launched),
      ...columns.flatMap((field) => [rentCell(row[field.rent]), rentCell(row[field.psf], true)]),
    ])
    const cards = [
      { label: 'Average units', value: number(bench.averageUnits, 0), sub: `${number(bench.schemeCount)} schemes`, dark: true },
      ...['1 Bed', '2 Bed', '3 Bed']
        .filter((type) => columns.some((field) => field.type === type))
        .map((type) => ({
          label: `Average ${type.toLowerCase()}`,
          value: money(bed(type)?.comparableRent),
          sub: shown(money2(bed(type)?.comparablePsf)) ? `${money2(bed(type).comparablePsf)} per sq ft` : '',
          dark: false,
        })),
    ].filter((card) => shown(card.value))
    return {
      ...base,
      kicker: `${section}  Rental evidence`,
      title: 'Comparable schemes',
      cards,
      tables: [
        table('RENTAL EVIDENCE', headers, body, {
          emphasis: body.length ? [body.length - 1] : [],
        }),
      ],
    }
  }

  if (page.id === 'benchmarkRent' || page.id === 'benchmarkPsf') {
    const psf = page.id === 'benchmarkPsf'
    const chart = benchmarkChart(model, psf)
    return {
      ...base,
      layout: 'benchmark',
      kicker: `${section}  Rental benchmark`,
      title: psf ? '£ per sq ft versus comparables' : 'Monthly rent versus comparables',
      note: chart.note,
      cards: chart.cards,
      chart: chart.chart,
    }
  }

  if (page.id === 'valuation') {
    const valuation = model.valuation || {}
    const profile = (model.yieldProfile || []).filter((row) => row.netOperating != null || row.tripleNet != null)
    const initial = profile.find((row) => row.measure === 'Initial')
    return {
      ...base,
      kicker: `${section}  Investment value`,
      title: 'Valuation and returns',
      cards: [
        {
          label: 'Market value',
          value: money(valuation.marketValue, { compact: true }),
          sub: shown(money2(valuation.valuePerSqFt)) ? `${money2(valuation.valuePerSqFt)} per sq ft` : '',
          dark: true,
        },
        {
          label: 'Initial yield',
          value: percent(valuation.netInitialYield, 2),
          sub: `Net operating ${percent(initial?.netOperating, 2)}`,
          dark: false,
        },
        { label: 'Equivalent yield', value: percent(valuation.equivalentYield, 2), sub: 'true equivalent', dark: false },
        { label: 'IRR', value: percent(valuation.irr, 2), sub: 'current cash flow', dark: false },
      ].filter((card) => shown(card.value)),
      tables: [
        table(
          'YIELD PROFILE — CURRENT SCENARIO',
          ['Measure', 'Net operating', 'Triple net'],
          profile.map((row) => [row.measure, percent(row.netOperating, 2), percent(row.tripleNet, 2)]),
          { aligns: ['left', 'right', 'right'] },
        ),
      ],
    }
  }

  if (page.id === 'cashflow') {
    const flow = model.cashflow || { labels: [], series: [] }
    const headers = ['', ...(flow.labels || []).map((label) => (label === 'Day 1' ? 'Day 1' : label))]
    const rows = (flow.series || []).map((row) => [row.label, ...(row.values || []).map((value) => millions(value))])
    const capex = yearList(flow.capexYears)
    return {
      ...base,
      kicker: `${section}  Investment value`,
      title: 'Ten-year cash flow',
      note: capex ? `Major capital expenditure is shown in ${capex}.` : '',
      cards: [
        { label: 'IRR', value: percent(model.valuation?.irr, 2), sub: 'workbook cash flow', dark: true },
        { label: 'Year 10 net income', value: money(flow.year10NetIncome, { compact: true }), sub: 'workbook year 10', dark: false },
        { label: 'Exit value', value: money(flow.exitValue, { compact: true }), sub: 'workbook year 10', dark: false },
      ].filter((card) => shown(card.value)),
      tables: [table('£ MILLION — MAPPED FROM THE VALUATION CASH FLOW', headers, rows)],
    }
  }

  if (page.id === 'further') {
    const info = model.furtherInfo || {}
    const propertyRows = pairs([
      ['Property', dash(model.meta.propertyName)],
      ['Tenure', dash(model.property?.tenure)],
      ['Sub-sector', dash(model.meta.subSector)],
      ['Operator', dash(model.property?.operator)],
      ['Location', dash(model.meta.location)],
      ...(info.description ? [['Description', info.description]] : []),
      ...(info.situation ? [['Situation', info.situation]] : []),
      ...(info.amenities || []).map((row) => [row.name, dash(row.value)]),
      ...(info.condition || []).map((row) => [row.name, dash(row.value)]),
      ...(info.storeys != null ? [['Height (max storeys)', number(info.storeys)]] : []),
      ...(info.carParking != null ? [['Car parking', number(info.carParking)]] : []),
    ])
    const rooms = info.accommodation || []
    const tables = [table('PROPERTY', ['', ''], propertyRows, { aligns: ['left', 'right'] })]
    if (rooms.length) {
      tables.push(
        table(
          'ACCOMMODATION',
          ['', 'Sq ft', 'Units', 'Average'],
          rooms.map((row) => [row.name, number(row.areaSqFt), number(row.units), row.average != null ? number(row.average, 0) : '—']),
        ),
      )
    }
    return {
      ...base,
      layout: rooms.length || model.images?.additional?.[0] ? 'split' : 'content',
      kicker: `${section}  Further information`,
      title: 'Property details',
      image: model.images?.additional?.[0] || null,
      imageCaption: [model.meta.propertyName, model.meta.location].filter(Boolean).join(', '),
      tables,
    }
  }

  return base
}

function yearList(years) {
  if (!years?.length) return null
  if (years.length === 1) return `year ${years[0]}`
  if (years.length === 2) return `years ${years[0]} and ${years[1]}`
  return `years ${years.slice(0, -1).join(', ')} and ${years[years.length - 1]}`
}

function sqftSafe(value) {
  if (value == null || !Number.isFinite(Number(value))) return '—'
  return `${number(value, 0)} sq ft`
}

export function buildReportSpec(model) {
  const plan = reportPlan(model)
  let contentNumber = 0
  const slides = plan.pages.map((page) => {
    const slide = compose(page, model)
    const numbered = page.id !== 'cover' && page.id !== 'contents'
    if (numbered) contentNumber += 1
    return { ...slide, number: numbered ? contentNumber : null }
  })
  const propertyName = model?.meta?.propertyName || 'Property'
  return {
    propertyName,
    footerLeft: `${propertyName}  |  VALUATION SUMMARY REPORT`,
    sections: plan.sections,
    slides,
  }
}
