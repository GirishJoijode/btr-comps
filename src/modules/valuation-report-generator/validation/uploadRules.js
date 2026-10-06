/** Largest OLIVE export we will read in the browser. Current exports are well under this. */
export const MAX_WORKBOOK_BYTES = 25 * 1024 * 1024

const READ_ERROR = 'Unable to read this workbook. Please upload a valid OLIVE Excel export.'
const TYPE_ERROR = 'Please upload an .xlsx OLIVE valuation export.'

export function rejectUpload(file) {
  if (!file) return TYPE_ERROR
  const name = String(file.name || '').toLowerCase()
  if (!name.endsWith('.xlsx')) return TYPE_ERROR
  if (!file.size) return READ_ERROR
  if (file.size > MAX_WORKBOOK_BYTES) {
    return 'This workbook is too large to process in the browser. Please upload an OLIVE valuation export under 25 MB.'
  }
  return null
}

export { READ_ERROR }
