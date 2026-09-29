import { createElement } from 'react'

/**
 * Dynamically load @react-pdf/renderer only when the user generates a PDF.
 */
export async function generateValuationPdfBlob(model) {
  const [{ pdf }, { default: ReportDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./ReportDocument.jsx'),
  ])
  const instance = pdf(createElement(ReportDocument, { model }))
  return instance.toBlob()
}
