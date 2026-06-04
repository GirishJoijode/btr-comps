import { useMemo, useState } from 'react'
import AnalysisTab from './components/analysis/AnalysisTab'
import { ErrorMessage, Loading } from './components/common/States'
import Tabs from './components/common/Tabs'
import DashboardTab from './components/dashboard/DashboardTab'
import SchemeDetailModal from './components/detail/SchemeDetailModal'
import { useRentalComps } from './hooks/useRentalComps'
import {
  applyFilters,
  buildCascadingOptions,
  EMPTY_FILTERS,
  sanitizeFilters,
} from './utils/filters'
import { latestPerScheme } from './utils/dateUtils'
import { exportToXlsx } from './utils/exportXlsx'

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
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

  // Header checkbox: select all filtered rows, or clear if all are selected.
  const toggleAll = () =>
    setSelectedIds((prev) => {
      const allSelected =
        filtered.length > 0 && filtered.every((r) => prev.has(r.Id))
      return allSelected ? new Set() : new Set(filtered.map((r) => r.Id))
    })

  const selectAllFiltered = () => setSelectedIds(new Set(filtered.map((r) => r.Id)))
  const clearSelection = () => setSelectedIds(new Set())

  // Export rules:
  //  - If rows are ticked, export EXACTLY those rows (respect the selection).
  //  - If nothing is ticked, export the filtered set deduplicated by Scheme,
  //    keeping each scheme's most recent Date_Filter entry (see latestPerScheme).
  const handleExport = () => {
    const rows =
      selectedIds.size > 0
        ? filtered.filter((r) => selectedIds.has(r.Id))
        : latestPerScheme(filtered)
    exportToXlsx(rows)
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
            records={filtered}
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
