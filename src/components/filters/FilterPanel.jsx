import { visibleFilterFields } from '../../config/filterConfig'
import MultiSelectFilter from './MultiSelectFilter'

export default function FilterPanel({
  options,
  filters,
  search,
  onFilterChange,
  onSearchChange,
  onReset,
  onExport,
  onSelectAll,
  onClearSelection,
  resultCount,
  selectedCount,
}) {
  return (
    <section className="filters" aria-label="Filters and search">
      <div className="filters__search">
        <label className="field">
          <span className="field__label">Search</span>
          <input
            type="search"
            className="field__input"
            placeholder="Search scheme, town, operator, amenities, comments…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </label>
      </div>

      <div className="filters__grid">
        {visibleFilterFields(filters).map(({ key, label }) => (
          <MultiSelectFilter
            key={key}
            fieldKey={key}
            label={label}
            options={options[key] || []}
            value={filters[key] || []}
            onChange={(next) => onFilterChange(key, next)}
          />
        ))}
      </div>

      <div className="filters__actions">
        <div className="filters__status">
          <span className="filters__count">
            {resultCount.toLocaleString('en-GB')} scheme
            {resultCount === 1 ? '' : 's'}
          </span>
          {selectedCount > 0 && (
            <span className="filters__selected">
              {selectedCount.toLocaleString('en-GB')} selected
            </span>
          )}
        </div>
        <div className="filters__buttons">
          <button type="button" className="btn btn--ghost" onClick={onReset}>
            Reset filters
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onSelectAll}
            disabled={resultCount === 0}
          >
            Select all
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onClearSelection}
            disabled={selectedCount === 0}
          >
            Clear selection
          </button>
          <button type="button" className="btn btn--primary" onClick={onExport}>
            Export XLSX
            <span className="btn__hint">
              {selectedCount > 0 ? `${selectedCount} selected` : 'all filtered'}
            </span>
          </button>
        </div>
      </div>
    </section>
  )
}
