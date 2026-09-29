import { lazy } from 'react'
import { valuationReportMeta } from './meta'

// Lazy-load so Rental Comparables / Operational Costs never pull PDF or
// OLIVE-parser code into their startup bundles.
export const valuationReportModule = {
  ...valuationReportMeta,
  Component: lazy(() => import('./ValuationReportGenerator')),
}
