# Responsiveness & QA checklist

The dashboard is a fixed full-viewport app on desktop/laptop and degrades to
natural page scrolling on small devices. Use this checklist after any layout or
styling change.

## Breakpoints in use (`src/styles/index.css`)

| Width        | Behaviour                                                            |
| ------------ | ------------------------------------------------------------------- |
| > 1024px     | Fixed viewport. Analysis = 2-row 6-column grid. Table fills height.  |
| ≤ 1024px     | Analysis charts stack vertically and scroll **inside** the tab.      |
| ≤ 860px      | KPI cards become 2-up.                                               |
| ≤ 760px      | Page scrolling allowed; header wraps; tabs go full-width; table ≥60vh. |
| ≤ 600px      | KPI cards tighten; filter buttons stack full-width (easy to tap).    |

## Desktop (≥1440px)

- [ ] Entire app fits within the viewport; no browser vertical scrollbar.
- [ ] No horizontal browser scrollbar.
- [ ] Header, KPI cards, filters, actions and the table are all visible at once.
- [ ] Table body scrolls internally; header row stays sticky.
- [ ] Scheme column stays sticky to the left of the checkbox column with no gap.
- [ ] Analysis tab shows all 5 charts without page scroll.

## Laptop (1280–1440px, ~720–800px tall)

- [ ] Dashboard fits without page scroll; table consumes remaining height.
- [ ] Analysis charts remain readable (labels, axes, legends).
- [ ] If charts no longer fit, scrolling happens inside the analysis area only.

## Tablet (~768–1024px)

- [ ] Filters wrap to multiple rows cleanly.
- [ ] KPI cards reflow (2-up).
- [ ] Analysis charts stack and scroll inside the content area.
- [ ] Table scrolls horizontally inside its container (not the page).

## Android phone (360–414px, e.g. Pixel / Galaxy)

- [ ] No horizontal page scrolling (only inside the table container).
- [ ] Header wraps; status line drops below; tabs are full-width and tappable.
- [ ] KPI cards are 2-up and legible.
- [ ] Filter dropdowns are full-width and easy to tap.
- [ ] Action buttons (Reset / Select all / Clear / Export) are ≥40px tall and
      stack full-width.
- [ ] Checkboxes are tappable and centred in their column.

## Functional regression (all viewports)

- [ ] Data loads from Ninox; loading spinner then content.
- [ ] Error state shows with a working Retry.
- [ ] Filters narrow the table and update KPIs + charts.
- [ ] Search matches Scheme / Town / Operator / Amenities / Comments.
- [ ] Row checkboxes select/deselect; header checkbox toggles all filtered rows.
- [ ] "Select all" and "Clear selection" work.
- [ ] Export with rows selected → only selected rows.
- [ ] Export with nothing selected → all filtered rows.
- [ ] Exported file is `rental_comps_export.xlsx` with the agreed columns,
      Yes/No flags, % occupancy and blanked zero rents/sizes/psf.

## Checkbox column specifics

- [ ] Header select-all checkbox is centred horizontally in the column.
- [ ] Header checkbox is centred vertically in the header row.
- [ ] Header checkbox sits directly above the row checkboxes (same axis).
- [ ] No white gap between the checkbox column and the Scheme column.
- [ ] Header and body checkbox cells share consistent padding/alignment.
