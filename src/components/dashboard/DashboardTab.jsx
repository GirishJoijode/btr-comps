import { useMemo } from 'react'
import { buildSummary } from '../../utils/analysis'
import FilterPanel from '../filters/FilterPanel'
import RentalCompsTable from '../table/RentalCompsTable'
import SummaryCards from './SummaryCards'

// The primary working area: KPIs, filters/search/actions and the comps table.
export default function DashboardTab({
  records,
  options,
  filters,
  search,
  selectedIds,
  onFilterChange,
  onSearchChange,
  onReset,
  onExport,
  onSelectAll,
  onClearSelection,
  onToggleRow,
  onToggleAll,
  onRowClick,
}) {
  const summary = useMemo(() => buildSummary(records), [records])

  return (
    <div className="tab-panel dashboard-panel">
      <SummaryCards summary={summary} />
      <FilterPanel
        options={options}
        filters={filters}
        search={search}
        onFilterChange={onFilterChange}
        onSearchChange={onSearchChange}
        onReset={onReset}
        onExport={onExport}
        onSelectAll={onSelectAll}
        onClearSelection={onClearSelection}
        resultCount={records.length}
        selectedCount={selectedIds.size}
      />
      <RentalCompsTable
        records={records}
        selectedIds={selectedIds}
        onToggleRow={onToggleRow}
        onToggleAll={onToggleAll}
        onRowClick={onRowClick}
      />
    </div>
  )
}
