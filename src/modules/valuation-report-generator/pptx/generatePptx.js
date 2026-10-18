/**
 * Load PptxGenJS only when a PowerPoint is generated.
 * Rental Comparables and Operational Costs never import this module.
 */
export async function generateValuationPptxBlob(model) {
  const [{ default: PptxGenJS }, { buildReportSpec }, { renderReportPptx }] = await Promise.all([
    import('pptxgenjs'),
    import('../report/spec.js'),
    import('./renderPptx.js'),
  ])
  const spec = buildReportSpec(model)
  const pptx = renderReportPptx(new PptxGenJS(), spec)
  return pptx.write({ outputType: 'blob' })
}
