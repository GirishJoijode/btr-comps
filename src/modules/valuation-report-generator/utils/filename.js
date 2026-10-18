export function buildReportFilename(model, extension) {
  const name = String(model?.meta?.propertyName || 'Valuation')
    .replace(/[<>:"/\\|?*\u0000-\u001F]+/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[_.]+|[_.]+$/g, '')
  const stamp = model?.meta?.valuationDateStamp || 'undated'
  const ext = String(extension || 'pptx').replace(/^\./, '')
  return `${name || 'Valuation'}_Valuation_Summary_${stamp}.${ext}`
}

export function buildPdfFilename(model) {
  return buildReportFilename(model, 'pdf')
}

export function buildPptxFilename(model) {
  return buildReportFilename(model, 'pptx')
}
