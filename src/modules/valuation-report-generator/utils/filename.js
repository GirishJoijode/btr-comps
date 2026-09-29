export function buildPdfFilename(model) {
  const name = String(model?.meta?.propertyName || 'Valuation')
    .replace(/[<>:"/\\|?*]+/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  const stamp = model?.meta?.valuationDateStamp || 'undated'
  return `${name || 'Valuation'}_Valuation_Summary_${stamp}.pdf`
}
