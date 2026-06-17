import { useMemo, useState } from 'react'
import AnalysisTab from './components/analysis/AnalysisTab'
import { ErrorMessage, Loading } from './components/common/States'
import Tabs from './components/common/Tabs'
import DashboardTab from './components/dashboard/DashboardTab'
import MapView from './components/map/MapView'
import SchemeDetailModal from './components/detail/SchemeDetailModal'
import { useRentalComps } from './hooks/useRentalComps'
import {
  applyFilters,
  buildCascadingOptions,
  EMPTY_FILTERS,
  sanitizeFilters,
} from './utils/filters'
import { latestPerScheme } from './utils/dateUtils'
import { buildSummary } from './utils/analysis'
import { exportToXlsx } from './utils/exportXlsx'

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'map', label: 'Map View' },
  { id: 'analysis', label: 'Analysis' },
]

export default function App() {
  const { status, records, error, reload } = useRentalComps()

  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [tab, setTab] = useState('dashboard')
  const [activeRecord, setActiveRecord] = useState(null)

  // Power BI–style cascading options: recomputed from the other active filters.
  const options = useMemo(
    () => buildCascadingOptions(records, filters, search),
    [records, filters, search]
  )
  const filtered = useMemo(
    () => applyFilters(records, filters, search),
    [records, filters, search]
  )

  // Table rows: one row per Scheme, showing its latest Date_Filter entry WITHIN
  // the filtered set (group-after-filter). Older periods only surface in the
  // detail modal's period toggle. Memoised so it only recomputes when the
  // filtered set changes.
  const rows = useMemo(() => latestPerScheme(filtered), [filtered])

  const summary = useMemo(() => buildSummary(filtered), [filtered])

  const isFiltering =
    search.trim() !== '' || Object.values(filters).some((v) => v !== '')

  // Dataset that drives the Analysis tab, in priority order:
  //   1. Selected rows (selection overrides filters)
  //   2. Filtered/search results
  //   3. The full dataset
  const analysisRecords = useMemo(
    () =>
      selectedIds.size > 0 ? records.filter((r) => selectedIds.has(r.Id)) : filtered,
    [records, filtered, selectedIds]
  )
  const analysisBasis =
    selectedIds.size > 0
      ? `Analysis based on ${analysisRecords.length.toLocaleString('en-GB')} selected record${
          analysisRecords.length === 1 ? '' : 's'
        }`
      : isFiltering
      ? 'Analysis based on filtered records'
      : 'Analysis based on all records'

  const handleFilterChange = (key, value) =>
    setFilters((prev) => sanitizeFilters({ ...prev, [key]: value }))

  const handleReset = () => {
    setFilters(EMPTY_FILTERS)
    setSearch('')
  }

  const toggleRow = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  // Header checkbox: select all grouped (visible) rows, or clear if all are.
  const toggleAll = () =>
    setSelectedIds((prev) => {
      const allSelected = rows.length > 0 && rows.every((r) => prev.has(r.Id))
      return allSelected ? new Set() : new Set(rows.map((r) => r.Id))
    })

  const selectAllFiltered = () => setSelectedIds(new Set(rows.map((r) => r.Id)))
  const clearSelection = () => setSelectedIds(new Set())

  // Export rules (each table row = a scheme's latest Date_Filter entry):
  //  - If rows are ticked, export EXACTLY those (latest) rows.
  //  - If nothing is ticked, export every grouped row (latest period per scheme).
  const handleExport = () => {
    const out =
      selectedIds.size > 0 ? records.filter((r) => selectedIds.has(r.Id)) : rows
    exportToXlsx(out)
  }

  const statusText =
    status === 'ready'
      ? `${records.length.toLocaleString('en-GB')} records · live from Ninox`
      : status === 'loading'
      ? 'Loading…'
      : 'Connection error'

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true" />
          <div>
            <h1>BTR Rental Comparables</h1>
            <p className="app-header__subtitle">Live Build&nbsp;to&nbsp;Rent letting evidence</p>
          </div>
        </div>

        <Tabs tabs={TABS} active={tab} onChange={setTab} disabled={status !== 'ready'} />

        <div className="app-header__status">
          <span className="status-dot" aria-hidden="true" />
          {statusText}
        </div>
      </header>

      <main className="app-main">
        {status === 'loading' && <Loading />}
        {status === 'error' && <ErrorMessage message={error} onRetry={reload} />}

        {status === 'ready' && tab === 'dashboard' && (
          <DashboardTab
            records={rows}
            summary={summary}
            options={options}
            filters={filters}
            search={search}
            selectedIds={selectedIds}
            onFilterChange={handleFilterChange}
            onSearchChange={setSearch}
            onReset={handleReset}
            onExport={handleExport}
            onSelectAll={selectAllFiltered}
            onClearSelection={clearSelection}
            onToggleRow={toggleRow}
            onToggleAll={toggleAll}
            onRowClick={setActiveRecord}
          />
        )}

        {status === 'ready' && tab === 'map' && (
          <MapView
            records={rows}
            selectedIds={selectedIds}
            onToggleRow={toggleRow}
            onRowClick={setActiveRecord}
            onClearSelection={clearSelection}
          />
        )}

        {status === 'ready' && tab === 'analysis' && (
          <AnalysisTab records={analysisRecords} basisLabel={analysisBasis} />
        )}
      </main>

      {activeRecord && (
        <SchemeDetailModal
          key={activeRecord.Id ?? `${activeRecord.Scheme}-${activeRecord.Date_Filter}`}
          record={activeRecord}
          allRecords={records}
          onClose={() => setActiveRecord(null)}
        />
      )}
    </div>
  )
}
