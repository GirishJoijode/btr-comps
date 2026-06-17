# Project structure

A clean, modern, static dashboard for BTR rental comparables.
**React + Vite + JavaScript** (no TypeScript). Data is fetched live from Ninox
on every page load.

## Folder layout

```
src/
  main.jsx                       # React entry point (mounts <App/>, imports global CSS)
  App.jsx                        # Thin shell: data hook + tab switch + shared state
  config/                        # All static configuration lives here
    dataSource.js                #   Ninox URL (single source of truth)
    filterConfig.js              #   Filter dropdown fields + search fields
    tableColumns.js              #   On-screen table columns
    exportColumns.js             #   XLSX export column mapping + number formats + filename
    theme.js                     #   Chart colour tokens (mirrors CSS theme)
  hooks/
    useRentalComps.js            # Fetches Ninox JSON; returns { status, records, error, reload }
  utils/                         # Pure logic, no React
    formatters.js                #   Currency / percent / psf / date / blank handling
    filters.js                   #   buildCascadingOptions (Power BI slicers), applyFilters
    dateUtils.js                 #   Date_Filter parsing, latest-per-scheme, period sorting
    analysis.js                  #   Summary KPIs + chart aggregations (per unit type)
    exportXlsx.js                #   XLSX builder/downloader (SheetJS)
    location.js                  #   Coordinate detection + on-demand OSM geocode + map links (no API keys)
  components/
    common/
      States.jsx                 #   Loading + error views
      Tabs.jsx                   #   Header tab switcher
    dashboard/
      DashboardTab.jsx           #   Composes summary + filters + table
      SummaryCards.jsx           #   KPI cards
    filters/
      FilterPanel.jsx            #   Dropdown filters, search, action buttons
    table/
      RentalCompsTable.jsx       #   Sortable, selectable comps table (row click opens detail modal)
    detail/
      SchemeDetailModal.jsx      #   Full scheme detail pop-up (opened from a row/marker click)
      SchemeMapPanel.jsx         #   Map embed (if coords) or location-search fallback
    map/
      MapView.jsx                #   Map View tab: Leaflet + clustering, plots filtered rows
    analysis/
      AnalysisTab.jsx            #   Chart grid (recharts)
      ChartCard.jsx              #   Reusable chart card shell
  styles/
    index.css                    # All styling (theme tokens, layout, responsive)
docs/
  PROJECT_STRUCTURE.md           # This file
  MOBILE_CHECKLIST.md            # Responsiveness checklist
```

## Where things live ("I want to change X…")

| To change…                         | Edit                                   |
| ---------------------------------- | -------------------------------------- |
| **Ninox URL / data source**        | `src/config/dataSource.js`             |
| **XLSX export columns & mapping**  | `src/config/exportColumns.js`          |
| **Export filename / number formats** | `src/config/exportColumns.js`        |
| **Which filters appear**           | `src/config/filterConfig.js`           |
| **Search fields**                  | `src/config/filterConfig.js`           |
| **Table columns / order / format** | `src/config/tableColumns.js`           |
| **Scheme detail modal content/layout** | `src/components/detail/SchemeDetailModal.jsx` |
| **Map / location logic (coords + links)** | `src/components/detail/SchemeMapPanel.jsx`, `src/utils/location.js` |
| **Map View tab (Leaflet markers + clustering)** | `src/components/map/MapView.jsx` |
| **Which analysis charts appear**   | `src/components/analysis/AnalysisTab.jsx` |
| **What dataset drives Analysis (selection > filters > all)** | `src/App.jsx` (`analysisRecords`) |
| **Cascading (slicer) filter logic** | `src/utils/filters.js` (`buildCascadingOptions`) |
| **Date_Filter / latest-period logic** | `src/utils/dateUtils.js`            |
| **Chart colours / theme tokens**   | `src/config/theme.js`                  |
| **Which charts appear**            | `src/components/analysis/AnalysisTab.jsx` |
| **Chart calculations**             | `src/utils/analysis.js`                |
| **Colours / global theme (CSS)**   | `:root` in `src/styles/index.css`      |
| **Number / date formatting logic** | `src/utils/formatters.js`, `src/utils/dateUtils.js` |
| **Filtering / search behaviour**   | `src/utils/filters.js`                 |
| **Data fetching**                  | `src/hooks/useRentalComps.js`          |

## Scheme + Date_Filter uniqueness & exports

`Scheme + Date_Filter` is the effective unique key: the same scheme can appear
once per reporting period (e.g. `ABC / Q2 2025` and `ABC / Q3 2025`).

- **Latest period** is determined by `dateFilterRank()` in `utils/dateUtils.js`,
  which understands `Q1–Q4 {year}` (Q4 > Q3 > Q2 > Q1 within a year), bare years,
  `H1/H2`, and `dd/mm/yyyy` / ISO dates. Unknown values sort last and never crash.
- **Grouped table (one row per scheme)**: `App.rows = latestPerScheme(filtered)`
  collapses each scheme to its latest Date_Filter entry *within the filtered set*
  (group-after-filter). Older periods only appear in the detail modal.
- **Detail modal period toggle**: the modal is given the full `records`, so when
  a scheme has more than one Date_Filter entry it shows a segmented period
  switcher (latest first, via `schemeDateEntries()`); selecting a period updates
  the whole modal. The clicked grouped row sets the initial period.
- **Export**: `App.handleExport`:
  - If rows are ticked → export exactly those (latest) rows.
  - If nothing is ticked → export every grouped row (latest period per scheme).
- **Summary cards** still count the full filtered set: "Total records" = all
  filtered entries, "Unique schemes" = the grouped row count.

## Cascading filters (Power BI slicers)

`buildCascadingOptions(records, filters, search)` computes each filter's options
from the dataset filtered by every *other* active filter + search (not by the
filter itself). The current selection is always kept in its own list so a
dropdown never goes blank if another filter invalidates it. `App.jsx` memoises
this on `[records, filters, search]`.

## What dataset drives the Analysis tab

`App.jsx` derives `analysisRecords` in priority order and passes it to
`AnalysisTab`:

1. **Selected rows** — if any table rows are ticked, analysis uses *only* those
   rows (`records.filter(r => selectedIds.has(r.Id))`); selection overrides filters.
2. **Filtered/search results** — otherwise the filtered set (all entries).
3. **Full dataset** — when nothing is selected and no filters/search are active.

A small indicator above the charts (`analysis-basis`) shows which of the three
is currently driving the analysis.

**Hybrid per-chart source** (inside `AnalysisTab`): the rent / £psf / occupancy
charts run on `latestPerScheme(records)` so a scheme reported across several
periods isn't double-counted, while **Records by date** uses all entries so the
per-period bars stay meaningful.

## Map View tab

`MapView.jsx` plots the same grouped rows the table shows (`App.rows` =
`latestPerScheme(filtered)`), so it always reflects the active filters and shows
one marker per scheme. Coordinates come straight from each record via
`getCoordinates()` (`Latitude`/`Longitude` etc.) — **no geocoding, lookups or
caching**; records without valid coordinates are skipped and counted as
"without coordinates". Markers cluster (`react-leaflet-cluster`) and expand on
zoom; the view fits bounds only when the *set* of plotted schemes changes (not
on selection). Each popup shares the global selection (`onToggleRow`) and opens
the existing detail modal (`onRowClick` → `setActiveRecord`), so Table, Map and
Analysis stay in sync on one `selectedIds` state.

## Map / location (detail modal)

The scheme detail modal resolves a location on demand when it opens
(`SchemeMapPanel` → `utils/location.geocodeRecord`): explicit coordinates are
used if present, otherwise an **approximate** location is fetched from free OSM
Nominatim (no API key) and cached in-memory for the session; if that fails a
clean Google Maps search fallback is shown.

## Environment variable for the Ninox URL

`dataSource.js` reads `import.meta.env.VITE_NINOX_URL` and falls back to the
hard-coded default. To override, create a `.env` file:

```
VITE_NINOX_URL=https://savills.ninoxdb.com/share/...
```

## Theme

- Primary (dark blue): `#25273A`
- Accent (yellow, highlights only): `#FFDF00`

CSS custom properties are defined in `:root` (`src/styles/index.css`); the
matching chart tokens are in `src/config/theme.js`.

## Data flow

```
useRentalComps()  ──>  records (raw Ninox JSON)
        │
   App.jsx state: filters, search, selectedIds, active tab
        │
   utils/filters.applyFilters()  ──>  filtered records
        │                                   │
        ├── DashboardTab (SummaryCards / FilterPanel / RentalCompsTable)
        └── AnalysisTab  (charts from utils/analysis)
        │
   utils/exportXlsx.exportToXlsx()  (selected rows, else filtered rows)
```
