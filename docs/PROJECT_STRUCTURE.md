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
    filters.js                   #   Filter options, applyFilters, EMPTY_FILTERS
    dateUtils.js                 #   Quarter parsing + latest-quarter + latest-modified
    analysis.js                  #   Summary KPIs + chart aggregations
    exportXlsx.js                #   XLSX builder/downloader (SheetJS)
    location.js                  #   Coordinate detection + Google/OSM map links (no API keys)
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
      SchemeDetailModal.jsx      #   Full scheme detail pop-up (opened from a row click)
      SchemeMapPanel.jsx         #   Map embed (if coords) or location-search fallback
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
| **Chart colours / theme tokens**   | `src/config/theme.js`                  |
| **Which charts appear**            | `src/components/analysis/AnalysisTab.jsx` |
| **Chart calculations**             | `src/utils/analysis.js`                |
| **Colours / global theme (CSS)**   | `:root` in `src/styles/index.css`      |
| **Number / date formatting logic** | `src/utils/formatters.js`, `src/utils/dateUtils.js` |
| **Filtering / search behaviour**   | `src/utils/filters.js`                 |
| **Data fetching**                  | `src/hooks/useRentalComps.js`          |

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
