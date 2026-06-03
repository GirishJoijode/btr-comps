import { useMemo, useState } from 'react'
import { COLUMNS } from '../../config/tableColumns'
import {
  formatBool,
  formatNumber,
  formatPercent,
  formatPsf,
  formatRent,
  isBlank,
} from '../../utils/formatters'

function formatCell(col, value) {
  switch (col.type) {
    case 'rent':
      return formatRent(value)
    case 'psf':
      return formatPsf(value)
    case 'size':
      return isBlank(value) ? '' : formatNumber(Math.round(value))
    case 'percent':
      return formatPercent(value)
    case 'number':
      return formatNumber(value)
    case 'bool':
      return formatBool(value)
    default:
      return isBlank(value) ? '' : String(value)
  }
}

// Numeric column types sort numerically; everything else sorts as text.
const NUMERIC = new Set(['rent', 'psf', 'size', 'percent', 'number'])

function compare(a, b, col) {
  const va = a[col.key]
  const vb = b[col.key]
  const aBlank = isBlank(va)
  const bBlank = isBlank(vb)
  // Blanks always sort to the bottom.
  if (aBlank && bBlank) return 0
  if (aBlank) return 1
  if (bBlank) return -1

  if (NUMERIC.has(col.type)) return Number(va) - Number(vb)
  if (col.type === 'bool') return va === vb ? 0 : va ? -1 : 1
  return String(va).localeCompare(String(vb), 'en', { numeric: true })
}

function cellClass(col) {
  return [
    col.align === 'right' ? 'is-right' : '',
    col.sticky ? 'is-sticky' : '',
    col.wide ? 'is-wide' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function Checkbox({ checked, onChange, label }) {
  return (
    <span className="checkbox-wrap">
      <input type="checkbox" aria-label={label} checked={checked} onChange={onChange} />
    </span>
  )
}

export default function RentalCompsTable({
  records,
  selectedIds,
  onToggleRow,
  onToggleAll,
  onRowClick,
}) {
  const [sort, setSort] = useState({ key: null, dir: 'asc' })

  const sorted = useMemo(() => {
    if (!sort.key) return records
    const col = COLUMNS.find((c) => c.key === sort.key)
    if (!col) return records
    const out = [...records].sort((a, b) => compare(a, b, col))
    return sort.dir === 'asc' ? out : out.reverse()
  }, [records, sort])

  function toggleSort(key) {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return { key: null, dir: 'asc' }
    })
  }

  const allSelected =
    records.length > 0 && records.every((r) => selectedIds.has(r.Id))

  if (records.length === 0) {
    return <div className="table-empty">No records match the current filters.</div>
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th className="col-select is-sticky-check" scope="col">
              <Checkbox
                checked={allSelected}
                onChange={onToggleAll}
                label="Select all filtered rows"
              />
            </th>
            {COLUMNS.map((col) => {
              const active = sort.key === col.key
              return (
                <th
                  key={col.key}
                  className={cellClass(col)}
                  aria-sort={
                    active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'
                  }
                >
                  <button
                    type="button"
                    className="th-button"
                    onClick={() => toggleSort(col.key)}
                  >
                    {col.label}
                    <span className="th-arrow">
                      {active ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                    </span>
                  </button>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((rec, i) => {
            const selected = selectedIds.has(rec.Id)
            // Open the detail modal on row click, but never when the click
            // originated inside the checkbox column.
            const handleRowClick = (e) => {
              if (!onRowClick) return
              if (e.target.closest('.col-select')) return
              onRowClick(rec)
            }
            const handleRowKeyDown = (e) => {
              if (!onRowClick) return
              if (e.target.closest('.col-select')) return
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onRowClick(rec)
              }
            }
            return (
              <tr
                key={rec.Id ?? i}
                className={`is-clickable${selected ? ' is-selected' : ''}`}
                onClick={handleRowClick}
                onKeyDown={handleRowKeyDown}
                tabIndex={0}
                aria-label={`View details for ${rec.Scheme ?? 'scheme'}`}
              >
                <td className="col-select is-sticky-check">
                  <Checkbox
                    checked={selected}
                    onChange={() => onToggleRow(rec.Id)}
                    label={`Select ${rec.Scheme ?? 'row'}`}
                  />
                </td>
                {COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className={cellClass(col)}
                    title={col.wide ? String(rec[col.key] ?? '') : undefined}
                  >
                    {formatCell(col, rec[col.key])}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
