// -----------------------------------------------------------------------------
// XLSX export (SheetJS / xlsx)
// -----------------------------------------------------------------------------
import * as XLSX from 'xlsx'
import {
  EXPORT_COLUMNS,
  EXPORT_FILENAME,
  NUMBER_FORMAT,
} from '../config/exportColumns'
import { isBlank } from './formatters'

function yesNo(raw) {
  if (raw === true || raw === 1) return 'Yes'
  if (raw === false || raw === 0) return 'No'
  // Non-boolean / non 1-0 value (e.g. a "proportion furnished" fraction) is
  // left as-is per spec.
  return isBlank(raw) ? '' : raw
}

// Resolve the export cell value for a record + column.
function cellValue(rec, col) {
  const raw = rec[col.key]
  switch (col.type) {
    case 'yesno':
      return yesNo(raw)
    case 'percent':
    case 'money':
    case 'psf':
    case 'size':
    case 'number':
      return isBlank(raw) ? '' : Number(raw)
    default:
      return isBlank(raw) ? '' : raw
  }
}

// Build and download the workbook for the given records.
export function exportToXlsx(records, filename = EXPORT_FILENAME) {
  const header = EXPORT_COLUMNS.map((c) => c.header)
  const rows = records.map((rec) => EXPORT_COLUMNS.map((c) => cellValue(rec, c)))
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows])

  // Apply per-cell number formats to the data rows.
  const range = XLSX.utils.decode_range(ws['!ref'])
  for (let c = 0; c < EXPORT_COLUMNS.length; c += 1) {
    const fmt = NUMBER_FORMAT[EXPORT_COLUMNS[c].type]
    if (!fmt) continue
    for (let r = 1; r <= range.e.r; r += 1) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })]
      if (cell && typeof cell.v === 'number') cell.z = fmt
    }
  }

  // Sensible column widths.
  ws['!cols'] = EXPORT_COLUMNS.map((c) => ({
    wch: Math.min(Math.max(c.header.length + 2, 12), 42),
  }))

  // Freeze the header row (ignored gracefully if unsupported).
  ws['!freeze'] = {
    xSplit: '0',
    ySplit: '1',
    topLeftCell: 'A2',
    activePane: 'bottomRight',
    state: 'frozen',
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Rental Comps')
  XLSX.writeFile(wb, filename)
}
