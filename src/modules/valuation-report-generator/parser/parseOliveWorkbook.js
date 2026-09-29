import * as XLSX from 'xlsx'
import { extractPropertyImage } from './extractImages'
import { buildReportModel } from '../mapping/buildReportModel'
import { validateOliveWorkbook } from '../validation/validateWorkbook'

export function parseOliveArrayBuffer(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, {
    type: 'array',
    cellDates: false,
    raw: true,
  })

  const validation = validateOliveWorkbook(workbook, XLSX)
  if (!validation.valid) {
    return { validation, model: null }
  }

  let propertyImage = null
  try {
    propertyImage = extractPropertyImage(arrayBuffer)
  } catch {
    propertyImage = null
  }

  const model = buildReportModel(workbook, XLSX, { propertyImage })
  const warnings = [...validation.warnings]
  if (!model.meta.propertyName) warnings.push('Property name is missing')
  if (!model.images.propertyImage) warnings.push('No property photograph was found in the workbook')

  return {
    validation: { ...validation, warnings },
    model,
    sheets: workbook.SheetNames || [],
  }
}
