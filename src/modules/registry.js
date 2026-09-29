// -----------------------------------------------------------------------------
// Module registry — add new databases/modules here.
// -----------------------------------------------------------------------------

import { rentalCompsModule } from './rental-comps'
import { operationalCostsModule } from './operational-costs'
import { valuationReportModule } from './valuation-report-generator'

export const MODULES = [rentalCompsModule, operationalCostsModule, valuationReportModule]

export const DEFAULT_MODULE_ID = rentalCompsModule.id

export function getModule(id) {
  return MODULES.find((m) => m.id === id) || MODULES[0]
}
