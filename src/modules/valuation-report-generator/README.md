# BTR Valuation Report Generator

Client-side module that turns an OLIVE valuation Excel export into an A4 landscape PDF.

This folder is the **entire** feature. Rental Comparables and Operational Costs do not import it.

## Purpose

Users select **BTR Valuation Report Generator**, drop `OLIVE EXPORT.xlsx`, and download a valuation summary PDF. Parsing, validation, and PDF generation all run in the browser.

## Isolation / removal boundary

To remove this module later:

1. Delete `src/modules/valuation-report-generator/`
2. Remove the `valuationReportModule` import and array entry from `src/modules/registry.js`
3. Uninstall `@react-pdf/renderer` and `fflate` if nothing else needs them (`xlsx` is shared with rental export)

Do **not** change Rental Comparables, Operational Costs, auth, Ninox, or the GitHub Pages workflow.

The only production integration is the registry entry. `App.jsx` and `ModuleSwitcher.jsx` already iterate `MODULES`.

## Expected workbook input

A value-only `.xlsx` OLIVE export. Filename is not used as a signature.

Required sheets (as in the attached sample):

- `EXECUTIVE SUMMARY`
- `Property Summary`
- `Income Report`
- `ERV Report`
- `Val Summary - Existing`
- `Rental Evidence`

Optional sheets: `Investment Evidence`, `Rental Evidence Benchmarking`, future `WEB_EXPORT_META`.

The Excel file is never uploaded, never sent to Ninox, and never stored remotely. It is read as an `ArrayBuffer` in memory.

## Validation strategy

`validation/oliveWorkbookSchema.js` is the fingerprint. `validation/validateWorkbook.js` returns `{ valid, errors, warnings, userMessage }`.

Checks:

1. Required sheet names
2. Multiple stable headings per sheet (e.g. EXECUTIVE SUMMARY, MARKET VALUE, INCOME SUMMARY, RUNNING COSTS, NET MARKET RENT, RENTAL EVIDENCE)
3. Required fields that actually have a value (headings that normalise to the same text as data labels are skipped)
4. Cross-sheet consistency for property name, units, and area — **structure**, not sample values such as “382 units”
5. Reject Excel errors (`#REF!`, `#VALUE!`, …) in required fields
6. Optional future `WEB_EXPORT_META` with `PRODUCT = OLIVE_BTR_VALUATION_REPORT` (not required today)

Invalid workbooks stop immediately. The UI shows a professional message, not stack traces.

## Mapping architecture

```
xlsx ArrayBuffer
  → SheetJS workbook (values) + ZIP image extract
  → validateOliveWorkbook
  → buildReportModel
  → PDF pages consume the model only
```

PDF components must not read Excel cell addresses.

Current vs market-rent figures stay separate:

- Passing income / running costs → `currentIncome`, `operatingCosts`
- ERV / net market rent / leakage → `marketRent`

Bedroom columns are never shifted. Studio / 1 Bed / 2 Bed / 3 Bed map only to their own fields; blanks stay blank.

Dates use the Excel serial via SheetJS `SSF.parse_date_code` and display as UK long dates (`7 September 2026`), not ambiguous `09/07/2026` strings.

## Report model

```js
{
  meta: { propertyName, location, subSector, valuationDate, valuationDateParts, valuationDateStamp },
  property: { operator, units, areaSqFt, averageUnitSize, yearBuilt, yearModernised, tenure, affordable, storeys, carParking },
  valuation: { marketValue, valuePerSqFt, netInitialYield, equivalentYield, reversionaryYield, irr, lessCostOfWorks, netValue },
  currentIncome: { rentalIncome, ancillaryIncome, grossIncome, badDebt, netOfBadDebt, netIncome, occupancy, occupiedUnits, ervVacantSpace, lettingMetrics, grossToNet, perSqFt },
  incomeByUnitType: [{ type, bedCode, units, areaSqFt, letAreaSqFt, incomePa, minPcm, maxPcm, avgPcm, avgPsf }],
  operatingCosts: { total, perSqFt, perUnit, ratio, grossToNet, categories: [...] },
  marketRent: { grossErv, grossErvPerSqFt, reversion, netErv, leakage, leased, vacant, unitTypes },
  rentalEvidence: [...],  // parsed; not rendered in Phase 1 PDF
  rentalBenchmarks: null, // sheet present but empty in the sample
  images: { propertyImage } // data URL from Property Summary drawing
}
```

## PDF pages

A4 landscape, `@react-pdf/renderer`. Page numbers are `n / total` on every page, including dividers.

1. Cover
2. Executive summary — current income labelled separately from ERV
3. Divider — Property & income summary (workbook photograph)
4. Property overview
5. Income and occupancy — current / passing income and letting profile
6. Income analysis — unit mix, plus the workbook “as of” rental-growth variances
7. Operating costs — current running costs only. A zero “Other” line is omitted.
8. Divider — Market rent summary
9. Market rent summary — gross ERV, reversion, leakage, unit-type table, short bridge
10. Market rent detail — one page only (the prototype’s duplicate is not repeated)
11. Rental evidence — scheme rows with strict bedroom columns; average is calculated from those rows
12. Benchmark — monthly market rent vs comparables
13. Benchmark — £ per sq ft vs comparables

Investment evidence is not a page. See below.

## Derived figures

Everything else is read from the workbook. These are the only calculated fields (`mapping/calculations.js`):

| Figure | Formula |
| --- | --- |
| Gross reversion £ | Gross ERV − current passing total income. The reversion **percentage** is the workbook total-row figure and is not recalculated. |
| Comparable average rent / £psf | Mean of scheme rows that have a value in that bedroom column. Blanks are excluded, never shifted. |
| Variance vs comparables | Subject ERV pcm or £psf − that average. Positive is above the comparable average. |
| Occupied units | Letting-profile units cell. Only if that cell is missing: units × occupancy, rounded. |

Current cost ratio, gross-to-net, yields, leakage, and the “as of” rental-growth variances are the workbook’s own outputs.

## Lazy loading

- Registry uses `React.lazy` so this module is not fetched on Rental / Op Costs startup
- `@react-pdf/renderer` is dynamically imported from `pdf/generatePdf.js` only when the user generates a PDF

## Dependencies used only by this module

| Package | Why |
| --- | --- |
| `@react-pdf/renderer` | Browser PDF with selectable text; no server |
| `fflate` | Read `xl/media` images from the xlsx ZIP (`xlsx` does not expose drawings) |

Shared: `xlsx` (already used for rental export).

## Investment section

**Investment section omitted — insufficient mapped source data.**

`Investment Evidence` has a header row and no comparable transactions. No divider and no investment pages are generated. `Rental Evidence Benchmarking` is also empty; benchmarks are calculated from `Rental Evidence` plus the subject ERV by bed.

`Val Summary - Existing` is required for fingerprinting. Headline valuation figures are taken from **EXECUTIVE SUMMARY**, which agrees with Property Summary. The valuation sheet’s property name `Copper House` is an internal workbook inconsistency and is not used.

## Still not rendered

Valuation cashflow, amenities narrative, monthly transactional activity, and the empty benchmarking sheet. Bedroom rents and ERV bridges are on the model and in the PDF.

## Excel vs prototype PDF (`ppt export.pdf`)

The prototype is visual reference only. Excel wins in every conflict. Observed differences on the attached sample:

| Item | OLIVE EXPORT.xlsx | Prototype PDF | Decision |
| --- | --- | --- | --- |
| Property name | `testrish` (Exec / Property Summary) | Appears to use a different asset name in places; Val Summary says `Copper House` | Use Exec / Property Summary. `Copper House` is an internal workbook inconsistency, not used. |
| Valuation date | Serial `46272` → **7 September 2026** | **9 July 2026** (US reading of 07/09) | Excel serial, UK long date |
| Market value | **£76,470,000** | **£76.88m** | Excel |
| £ per sq ft | **£317.43** | **£319** | Excel (triple-net yield row) |
| Gross / total income | **£5,660,700** | **£6.50m** | Excel |
| Net income (current) | **£3,179,602** | **£4.01m** | Excel current net, not ERV net |
| Occupancy | **82.2%** (314 of 382) | 82.2% | Matches |
| Gross ERV | **£7,086,300** | (prototype mixed) | Excel |
| Net ERV / net market rent | **£4,325,017** | (prototype mixed with current net) | Excel ERV figure, kept separate from current net |
| Initial yield (triple net) | **3.89%** | **5.22%** | Excel triple-net initial. Do not substitute an unrelated yield. |
| True equivalent yield | **5.25%** | 5.25% | Matches |
| Cost ratio (of income net of bad debt) | **42.8%** | **37.2%** | Excel current cost summary |
| Total running costs | **£2,379,378** | (prototype used a different total) | Excel Income Report cost summary |
| Rental evidence bedrooms | Columns are Studio / 1 Bed / 2 Bed / 3 Bed; some schemes have blank Studio | Prototype appeared to shift rents left into blank bedroom columns | Never shift. Blank stays blank. |

Do not copy prototype numbers, duplicate pages, or denormalised percentages.
