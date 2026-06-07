import FilterPanel from '../filters/FilterPanel'
import RentalCompsTable from '../table/RentalCompsTable'
import SummaryCards from './SummaryCards'

// The primary working area: KPIs, filters/search/actions and the comps table.
// `records` here are the grouped table rows (one latest entry per scheme);
// `summary` is computed upstream from the full filtered set.
export default function DashboardTab({
  records,
  summary,
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
