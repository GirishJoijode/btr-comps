import { CHART_COLORS, PPT_COLORS as C } from '../report/theme'

const FONT = 'Calibri'
const SLIDE_W = 13.333
const MARGIN = 0.42
const CONTENT_W = 12.5

function shape(slide, x, y, w, h, fill, line = fill) {
  slide.addShape('rect', {
    x,
    y,
    w,
    h,
    fill: { color: fill },
    line: { color: line, pt: 0.75 },
  })
}

function text(slide, value, options) {
  slide.addText(value == null ? '' : String(value), {
    fontFace: FONT,
    margin: 0,
    valign: 'middle',
    ...options,
  })
}

function paintFooter(slide, spec, slideSpec, dark) {
  const color = dark ? C.soft : C.muted
  text(slide, spec.footerLeft, {
    x: MARGIN,
    y: 7.16,
    w: 7.4,
    h: 0.24,
    fontSize: 10,
    color,
  })
  text(slide, 'CONFIDENTIAL', {
    x: 7.8,
    y: 7.16,
    w: 2.8,
    h: 0.24,
    fontSize: 10,
    color,
    align: 'center',
  })
  if (slideSpec.number != null) {
    text(slide, String(slideSpec.number), {
      x: 10.8,
      y: 7.16,
      w: 2.1,
      h: 0.24,
      fontSize: 10,
      color,
      align: 'right',
    })
  }
}

function paintHeader(slide, kicker, title) {
  text(slide, kicker, {
    x: MARGIN,
    y: 0.18,
    w: CONTENT_W,
    h: 0.24,
    fontSize: 11,
    color: C.muted,
  })
  text(slide, title, {
    x: MARGIN,
    y: 0.4,
    w: CONTENT_W,
    h: 0.36,
    fontSize: 20,
    bold: true,
    color: C.navy,
  })
  shape(slide, MARGIN, 0.82, CONTENT_W, 0.04, C.yellow)
}

function paintCards(slide, cards, y, h, x = MARGIN, w = CONTENT_W) {
  if (!cards?.length) return y
  const gap = 0.1
  const cardW = (w - gap * (cards.length - 1)) / cards.length
  const valueSize = cards.length >= 5 ? 13 : 16
  cards.forEach((card, index) => {
    const left = x + index * (cardW + gap)
    shape(slide, left, y, cardW, h, card.dark ? C.navy : C.white, card.dark ? C.navy : C.line)
    text(slide, String(card.label || '').toUpperCase(), {
      x: left + 0.1,
      y: y + 0.08,
      w: cardW - 0.2,
      h: 0.24,
      fontSize: 9,
      bold: true,
      color: card.dark ? C.yellow : C.muted,
    })
    text(slide, card.value, {
      x: left + 0.1,
      y: y + 0.32,
      w: cardW - 0.2,
      h: 0.38,
      fontSize: valueSize,
      bold: true,
      color: card.dark ? C.white : C.navy,
    })
    if (card.sub && card.sub !== '—') {
      text(slide, card.sub, {
        x: left + 0.1,
        y: y + h - 0.32,
        w: cardW - 0.2,
        h: 0.26,
        fontSize: 10,
        color: card.dark ? C.soft : C.muted,
      })
    }
  })
  return y + h
}

function paintFacts(slide, facts, y) {
  if (!facts?.length) return y
  const cols = 4
  const gap = 0.08
  const w = (CONTENT_W - gap * (cols - 1)) / cols
  const h = 0.72
  facts.forEach((fact, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    const left = MARGIN + col * (w + gap)
    const top = y + row * (h + gap)
    shape(slide, left, top, w, h, C.white, C.line)
    text(slide, String(fact[0] || '').toUpperCase(), {
      x: left + 0.1,
      y: top + 0.06,
      w: w - 0.2,
      h: 0.2,
      fontSize: 9,
      color: C.muted,
    })
    text(slide, fact[1], {
      x: left + 0.1,
      y: top + 0.28,
      w: w - 0.2,
      h: 0.34,
      fontSize: 13,
      bold: true,
      color: C.navy,
    })
  })
  const rows = Math.ceil(facts.length / cols)
  return y + rows * (h + gap)
}

function columnWidths(table, width) {
  const count = table.headers.length
  if (count <= 1) return [width]
  const firstShare = count === 2 ? 0.62 : count >= 8 ? 0.16 : 0.28
  const first = width * firstShare
  const rest = (width - first) / (count - 1)
  return [first, ...Array.from({ length: count - 1 }, () => rest)]
}

function paintTable(slide, tableSpec, x, y, w) {
  if (!tableSpec || !tableSpec.headers?.length) return y
  const colW = columnWidths(tableSpec, w)
  let top = y
  if (tableSpec.title) {
    shape(slide, x, top, w, 0.3, C.navy)
    text(slide, tableSpec.title, {
      x: x + 0.1,
      y: top,
      w: w - 0.16,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: C.yellow,
    })
    top += 0.3
  }
  const fontSize = tableSpec.headers.length >= 9 || (tableSpec.rows || []).length >= 12 ? 8 : tableSpec.headers.length >= 6 ? 9 : 11
  const emphasis = new Set(tableSpec.emphasis || [])
  const header = tableSpec.headers.map((label, index) => ({
    text: label || ' ',
    options: {
      fill: { color: C.navy },
      color: C.yellow,
      bold: true,
      align: tableSpec.aligns?.[index] || (index === 0 ? 'left' : 'right'),
      valign: 'middle',
      fontFace: FONT,
      fontSize,
      margin: [3, 4, 3, 4],
    },
  }))
  const body = (tableSpec.rows || []).map((row, rowIndex) =>
    row.map((cell, index) => ({
      text: cell == null || cell === '' ? '—' : String(cell),
      options: {
        fill: { color: emphasis.has(rowIndex) ? 'F3F1EA' : C.white },
        color: emphasis.has(rowIndex) ? C.navy : C.ink,
        bold: emphasis.has(rowIndex),
        align: tableSpec.aligns?.[index] || (index === 0 ? 'left' : 'right'),
        valign: 'middle',
        fontFace: FONT,
        fontSize,
        margin: [2, 4, 2, 4],
      },
    })),
  )
  const rows = tableSpec.headers.some((label) => label) ? [header, ...body] : body
  if (!rows.length) return top
  const available = Math.max(0.9, 6.95 - top)
  const preferred = fontSize >= 11 ? 0.28 : 0.24
  const rowH = Math.min(preferred, available / rows.length)
  const cellMargin = rowH < 0.22 ? [1, 3, 1, 3] : [2, 4, 2, 4]
  for (const row of rows) {
    for (const cell of row) cell.options.margin = cellMargin
  }
  slide.addTable(rows, {
    x,
    y: top,
    w,
    h: rowH * rows.length,
    rowH,
    colW,
    border: [
      { pt: 0.5, color: C.line },
      { pt: 0.5, color: C.line },
      { pt: 0.5, color: C.line },
      { pt: 0.5, color: C.line },
    ],
    fontFace: FONT,
    valign: 'middle',
    autoPage: false,
  })
  return top + rowH * rows.length
}

function paintPhoto(slide, dataUrl, x, y, w, h) {
  if (!dataUrl) return
  slide.addImage({
    data: dataUrl,
    x,
    y,
    w,
    h,
    sizing: { type: 'cover', x, y, w, h },
  })
}

function paintChart(slide, pptx, chart, x, y, w, h) {
  if (!chart?.series?.length || !chart.categories?.length) return
  slide.addChart(
    pptx.ChartType.bar,
    chart.series.map((series) => ({
      name: series.name,
      labels: chart.categories,
      values: series.values,
    })),
    {
      x,
      y,
      w,
      h,
      barDir: chart.direction || 'col',
      barGrouping: chart.grouping || 'clustered',
      showLegend: true,
      legendPos: 'b',
      legendFontSize: 9,
      legendColor: C.ink,
      chartColors: CHART_COLORS,
      showValue: false,
      showTitle: false,
      catAxisLabelColor: C.muted,
      valAxisLabelColor: C.muted,
      catAxisLabelFontSize: 10,
      valAxisLabelFontSize: 10,
      catAxisLabelFontFace: FONT,
      valAxisLabelFontFace: FONT,
      valAxisFormatCode: chart.format || 'General',
      valAxisMinVal: 0,
      displayBlanksAs: 'gap',
      valGridLine: { color: C.line, size: 0.5 },
      catGridLine: { style: 'none' },
    },
  )
}

function paintCover(slide, spec, slideSpec) {
  slide.background = { color: C.navy }
  shape(slide, MARGIN, 0.55, 1.15, 0.1, C.yellow)
  text(slide, slideSpec.kicker, {
    x: MARGIN,
    y: 1.0,
    w: 10,
    h: 0.32,
    fontSize: 14,
    color: C.yellow,
    bold: true,
  })
  text(slide, slideSpec.title, {
    x: MARGIN,
    y: 1.5,
    w: 11.5,
    h: 1.3,
    fontSize: 36,
    bold: true,
    color: C.white,
    valign: 'top',
  })
  text(slide, slideSpec.lede, {
    x: MARGIN,
    y: 3.05,
    w: 10,
    h: 0.36,
    fontSize: 16,
    color: C.white,
  })
  text(slide, slideSpec.note, {
    x: MARGIN,
    y: 3.5,
    w: 8,
    h: 0.32,
    fontSize: 14,
    color: C.soft,
  })
  text(slide, 'BTR VALUATION SUMMARY REPORT', {
    x: MARGIN,
    y: 6.85,
    w: 8,
    h: 0.28,
    fontSize: 12,
    color: C.yellow,
  })
}

function paintContents(slide, spec, slideSpec) {
  slide.background = { color: C.cream }
  text(slide, 'CONTENTS', {
    x: MARGIN,
    y: 0.4,
    w: CONTENT_W,
    h: 0.28,
    fontSize: 13,
    color: C.navy,
  })
  text(slide, slideSpec.title, {
    x: MARGIN,
    y: 0.72,
    w: CONTENT_W,
    h: 0.46,
    fontSize: 28,
    bold: true,
    color: C.navy,
  })
  shape(slide, MARGIN, 1.28, 1.15, 0.06, C.yellow)
  spec.sections.forEach((section, index) => {
    const y = 1.6 + index * 0.85
    text(slide, section.number, {
      x: MARGIN,
      y,
      w: 0.8,
      h: 0.5,
      fontSize: 18,
      bold: true,
      color: C.navy,
    })
    text(slide, section.title, {
      x: 1.4,
      y,
      w: 10.5,
      h: 0.32,
      fontSize: 16,
      bold: true,
      color: C.navy,
    })
    text(slide, section.blurb, {
      x: 1.4,
      y: y + 0.3,
      w: 10.5,
      h: 0.26,
      fontSize: 12,
      color: C.muted,
    })
    shape(slide, MARGIN, y + 0.68, CONTENT_W, 0.01, C.line)
  })
  text(slide, spec.footerLeft, {
    x: MARGIN,
    y: 7.05,
    w: CONTENT_W,
    h: 0.24,
    fontSize: 11,
    color: C.muted,
  })
}

function paintDivider(slide, spec, slideSpec) {
  slide.background = { color: C.navy }
  shape(slide, 0.6, 1.35, 1.15, 0.1, C.yellow)
  text(slide, slideSpec.kicker, {
    x: 0.6,
    y: 1.65,
    w: 7.2,
    h: 0.32,
    fontSize: 14,
    color: C.yellow,
  })
  text(slide, slideSpec.title, {
    x: 0.6,
    y: 2.1,
    w: 7.2,
    h: 1.3,
    fontSize: 32,
    bold: true,
    color: C.white,
    valign: 'top',
  })
  if (slideSpec.lede) {
    text(slide, slideSpec.lede, {
      x: 0.6,
      y: 3.55,
      w: 6.8,
      h: 0.9,
      fontSize: 15,
      color: C.soft,
      valign: 'top',
    })
  }
  if (slideSpec.image) {
    paintPhoto(slide, slideSpec.image, 8.35, 1.55, 4.4, 3.5)
    text(slide, slideSpec.imageCaption, {
      x: 8.35,
      y: 5.15,
      w: 4.4,
      h: 0.28,
      fontSize: 11,
      color: C.yellow,
    })
  }
  paintFooter(slide, spec, slideSpec, true)
}

function paintBenchmark(slide, pptx, spec, slideSpec) {
  slide.background = { color: C.cream }
  paintHeader(slide, slideSpec.kicker, slideSpec.title)
  if (slideSpec.note) {
    text(slide, slideSpec.note, {
      x: MARGIN,
      y: 0.96,
      w: CONTENT_W,
      h: 0.36,
      fontSize: 11,
      color: C.muted,
      valign: 'top',
    })
  }
  paintChart(slide, pptx, slideSpec.chart, MARGIN, 1.4, 9.15, 5.45)
  const cards = slideSpec.cards || []
  if (cards.length) {
    const gap = 0.1
    const h = Math.min(1.35, (5.45 - gap * (cards.length - 1)) / cards.length)
    cards.forEach((card, index) => {
      const y = 1.4 + index * (h + gap)
      shape(slide, 9.75, y, 3.15, h, card.dark ? C.navy : C.white, card.dark ? C.navy : C.line)
      text(slide, String(card.label || '').toUpperCase(), {
        x: 9.88,
        y: y + 0.08,
        w: 2.9,
        h: 0.22,
        fontSize: 10,
        bold: true,
        color: card.dark ? C.yellow : C.muted,
      })
      text(slide, card.value, {
        x: 9.88,
        y: y + 0.32,
        w: 2.9,
        h: 0.36,
        fontSize: 16,
        bold: true,
        color: card.dark ? C.white : C.navy,
      })
      if (card.sub && card.sub !== '—') {
        text(slide, card.sub, {
          x: 9.88,
          y: y + 0.72,
          w: 2.9,
          h: 0.4,
          fontSize: 11,
          color: card.dark ? C.soft : C.muted,
          valign: 'top',
        })
      }
    })
  }
  paintFooter(slide, spec, slideSpec, false)
}

function paintProperty(slide, spec, slideSpec) {
  slide.background = { color: C.cream }
  paintHeader(slide, slideSpec.kicker, slideSpec.title)
  const hasPhoto = Boolean(slideSpec.image)
  const tableW = hasPhoto ? 7.35 : CONTENT_W
  paintTable(slide, slideSpec.tables?.[0], MARGIN, 1.05, tableW)
  if (hasPhoto) {
    shape(slide, 8.0, 1.05, 4.9, 5.55, C.white, C.line)
    paintPhoto(slide, slideSpec.image, 8.12, 1.17, 4.66, 4.85)
    text(slide, slideSpec.imageCaption, {
      x: 8.12,
      y: 6.1,
      w: 4.66,
      h: 0.36,
      fontSize: 11,
      color: C.muted,
    })
  }
  paintFooter(slide, spec, slideSpec, false)
}

function paintFurther(slide, spec, slideSpec) {
  slide.background = { color: C.cream }
  paintHeader(slide, slideSpec.kicker, slideSpec.title)
  const second = slideSpec.tables?.[1]
  const photo = slideSpec.image
  const split = Boolean(second || photo)
  const leftW = split ? 6.15 : CONTENT_W
  paintTable(slide, slideSpec.tables?.[0], MARGIN, 1.05, leftW)
  if (split) {
    let top = 1.05
    if (second) top = paintTable(slide, second, 6.75, top, 6.15)
    if (photo) {
      const y = second ? top + 0.12 : 1.05
      const h = 6.9 - y
      if (h >= 1.15) paintPhoto(slide, photo, 6.75, y, 6.15, h)
    }
  }
  paintFooter(slide, spec, slideSpec, false)
}

function paintContent(slide, spec, slideSpec) {
  slide.background = { color: C.cream }
  paintHeader(slide, slideSpec.kicker, slideSpec.title)
  let y = 1.02
  if (slideSpec.cards?.length) y = paintCards(slide, slideSpec.cards, y, 1.15) + 0.12
  if (slideSpec.note && slideSpec.layout !== 'benchmark') {
    text(slide, slideSpec.note, {
      x: MARGIN,
      y,
      w: CONTENT_W,
      h: 0.28,
      fontSize: 11,
      color: C.muted,
    })
    y += 0.32
  }
  if (slideSpec.layout === 'split' && slideSpec.tables?.length > 1) {
    paintTable(slide, slideSpec.tables[0], MARGIN, y, 7.55)
    paintTable(slide, slideSpec.tables[1], 8.15, y, 4.75)
  } else if (slideSpec.tables?.[0]) {
    paintTable(slide, slideSpec.tables[0], MARGIN, y, CONTENT_W)
  }
  paintFooter(slide, spec, slideSpec, false)
}

function paintSlide(slide, pptx, spec, slideSpec) {
  if (slideSpec.layout === 'cover') return paintCover(slide, spec, slideSpec)
  if (slideSpec.layout === 'contents') return paintContents(slide, spec, slideSpec)
  if (slideSpec.layout === 'divider') return paintDivider(slide, spec, slideSpec)
  if (slideSpec.layout === 'exec') {
    slide.background = { color: C.cream }
    paintHeader(slide, slideSpec.kicker, slideSpec.title)
    let y = 1.02
    y = paintCards(slide, slideSpec.cards, y, 1.2) + 0.14
    paintFacts(slide, slideSpec.facts, y)
    paintFooter(slide, spec, slideSpec, false)
    return
  }
  if (slideSpec.layout === 'benchmark') return paintBenchmark(slide, pptx, spec, slideSpec)
  if (slideSpec.layout === 'property') return paintProperty(slide, spec, slideSpec)
  if (slideSpec.id === 'further') return paintFurther(slide, spec, slideSpec)
  if (slideSpec.id === 'analysis' && slideSpec.cards?.length) {
    slide.background = { color: C.cream }
    paintHeader(slide, slideSpec.kicker, slideSpec.title)
    paintTable(slide, slideSpec.tables?.[0], MARGIN, 1.02, CONTENT_W)
    const noteY = 4.55
    if (slideSpec.note) {
      text(slide, slideSpec.note, {
        x: MARGIN,
        y: noteY,
        w: CONTENT_W,
        h: 0.26,
        fontSize: 11,
        color: C.muted,
      })
    }
    paintCards(slide, slideSpec.cards, noteY + 0.32, 1.15)
    paintFooter(slide, spec, slideSpec, false)
    return
  }
  return paintContent(slide, spec, slideSpec)
}

export function renderReportPptx(pptx, spec) {
  pptx.defineLayout({ name: 'REPORT_16x9', width: SLIDE_W, height: 7.5 })
  pptx.layout = 'REPORT_16x9'
  pptx.author = 'BTR Valuation Summary'
  pptx.title = `${spec.propertyName} Valuation Summary`
  pptx.subject = 'Valuation summary report'
  for (const slideSpec of spec.slides) {
    const slide = pptx.addSlide()
    paintSlide(slide, pptx, spec, slideSpec)
  }
  return pptx
}
