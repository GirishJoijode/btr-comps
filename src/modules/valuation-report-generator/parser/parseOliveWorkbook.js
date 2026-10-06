import * as XLSX from 'xlsx'
import { extractWorkbookImages } from './extractImages'
import { buildReportModel } from '../mapping/buildReportModel'
import { assessReport } from '../validation/qualityGate'
import { READ_ERROR } from '../validation/uploadRules'
import { validateOliveWorkbook } from '../validation/validateWorkbook'

const STRUCTURE_ERROR =
  'Invalid OLIVE valuation export. The workbook structure does not match the expected report template.'

function looksLikeXlsx(arrayBuffer) {
  const bytes = arrayBuffer instanceof Uint8Array ? arrayBuffer : new Uint8Array(arrayBuffer)
  return bytes.length > 4 && bytes[0] === 0x50 && bytes[1] === 0x4b
}

export function parseOliveArrayBuffer(arrayBuffer) {
  if (!looksLikeXlsx(arrayBuffer)) {
    return {
      validation: {
        valid: false,
        errors: [READ_ERROR],
        userMessage: READ_ERROR,
        warnings: [],
        checksPassed: [],
      },
      model: null,
      sheets: [],
    }
  }

  let workbook
  try {
    workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      cellDates: false,
      raw: true,
    })
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[valuation-report] workbook could not be read', error?.name || 'Error')
    }
    return {
      validation: {
        valid: false,
        errors: [READ_ERROR],
        userMessage: READ_ERROR,
        warnings: [],
        checksPassed: [],
      },
      model: null,
      sheets: [],
    }
  }

  if (!workbook?.SheetNames?.length) {
    return {
      validation: {
        valid: false,
        errors: [READ_ERROR],
        userMessage: READ_ERROR,
        warnings: [],
        checksPassed: [],
      },
      model: null,
      sheets: [],
    }
  }

  let validation
  try {
    validation = validateOliveWorkbook(workbook, XLSX)
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[valuation-report] validation failed', error?.name || 'Error')
    }
    return {
      validation: {
        valid: false,
        errors: [STRUCTURE_ERROR],
        userMessage: STRUCTURE_ERROR,
        warnings: [],
        checksPassed: [],
      },
      model: null,
      sheets: workbook.SheetNames || [],
    }
  }

  if (!validation.valid) {
    return { validation, model: null, sheets: workbook.SheetNames || [] }
  }

  let images = { propertyImage: null, additionalImages: [] }
  try {
    images = extractWorkbookImages(arrayBuffer)
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[valuation-report] images skipped', error?.name || 'Error')
    }
    images = { propertyImage: null, additionalImages: [] }
  }

  let model
  try {
    model = buildReportModel(workbook, XLSX, {
      propertyImage: images.propertyImage,
      additionalImages: images.additionalImages,
    })
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[valuation-report] mapping failed', error?.name || 'Error')
    }
    return {
      validation: {
        valid: false,
        errors: [STRUCTURE_ERROR],
        userMessage: STRUCTURE_ERROR,
        warnings: [],
        checksPassed: [],
      },
      model: null,
      sheets: workbook.SheetNames || [],
    }
  }

  const quality = assessReport(model)
  if (!quality.canGenerate) {
    return {
      validation: {
        valid: false,
        errors: [quality.userMessage, ...quality.errors],
        userMessage: quality.userMessage,
        warnings: quality.warnings,
        checksPassed: [],
      },
      model: null,
      sheets: workbook.SheetNames || [],
    }
  }

  return {
    validation: {
      ...validation,
      warnings: [...validation.warnings, ...quality.warnings],
      quality,
    },
    model,
    sheets: workbook.SheetNames || [],
  }
}
