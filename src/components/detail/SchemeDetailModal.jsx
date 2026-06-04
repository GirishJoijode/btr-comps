import { useEffect, useMemo, useState } from 'react'
import { schemeDateEntries } from '../../utils/dateUtils'
import {
  formatDate,
  formatNumber,
  formatPercent,
  formatPsf,
  formatRent,
  isBlank,
} from '../../utils/formatters'
import SchemeMapPanel from './SchemeMapPanel'

const DASH = '—'

// Yes/No for booleans and 1/0 flags; dash when unset.
function yesNo(value) {
  if (value === true || value === 1 || value === '1') return 'Yes'
  if (value === false || value === 0 || value === '0') return 'No'
  return DASH
}

// Blank-aware wrapper: empty formatter output becomes an em dash.
function dash(value) {
  return value === '' || value === null || value === undefined ? DASH : value
}

// Generic display for "additional" fields — preserves 0 so no data is lost.
function genericValue(value) {
  if (value === null || value === undefined) return DASH
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'string' && value.trim() === '') return DASH
  return String(value)
}

// Fields rendered explicitly elsewhere in the modal (excluded from "Additional").
const SHOWN_KEYS = new Set([
  'Id',
  'Scheme',
  'Town',
  'Regional_Filter',
  'Date_Filter',
  'Source',
  'Source_Verified',
  'Units',
  'Occupancy',
  'Stabilised',
  'Amenity_Grade',
  'Launched',
  'Operator',
  'Studio_Rent',
  'Studio_Size',
  'Studio_psf',
  'Bed1_Rent',
  'Bed1_Size',
  'Bed1_psf',
  'Bed2_Rent',
  'Bed2_Size',
  'Bed2_psf',
  'Bed3_Rent',
  'Bed3_Size',
  'Bed3_psf',
  'Amenities',
  'Furnished',
  'Height',
  'Comparables_From',
  'Deals',
  'Comments',
  'Last_Updated_By',
  'Last_Updated_At',
  'Last modified',
])

const UNIT_ROWS = [
  { label: 'Studio', rent: 'Studio_Rent', size: 'Studio_Size', psf: 'Studio_psf' },
  { label: '1 Bed', rent: 'Bed1_Rent', size: 'Bed1_Size', psf: 'Bed1_psf' },
  { label: '2 Bed', rent: 'Bed2_Rent', size: 'Bed2_Size', psf: 'Bed2_psf' },
  { label: '3 Bed', rent: 'Bed3_Rent', size: 'Bed3_Size', psf: 'Bed3_psf' },
]

function Metric({ label, value }) {
  return (
    <div className="metric">
      <span className="metric__label">{label}</span>
      <span className="metric__value">{value}</span>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span className="info-row__label">{label}</span>
      <span className="info-row__value">{value}</span>
    </div>
  )
}

export default function SchemeDetailModal({ record, allRecords, onClose }) {
  // A scheme can have multiple Date_Filter entries (Scheme + Date_Filter is the
  // effective unique key). Consolidate them into one modal and let the user
  // switch period via a segmented toggle; the rest of the modal reflects the
  // currently-selected period.
  const siblings = useMemo(
    () => schemeDateEntries(allRecords || [record], record),
    [allRecords, record]
  )
  const [activeDate, setActiveDate] = useState(() => record?.Date_Filter ?? '')
  const active = useMemo(
    () => siblings.find((s) => s.Date_Filter === activeDate) || record,
    [siblings, activeDate, record]
  )

  // Close on Escape and lock background scroll while open.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  if (!record) return null

  const sizeText = (key) =>
    isBlank(active[key]) ? DASH : `${formatNumber(Math.round(active[key]))} sq ft`

  const additional = Object.keys(active).filter((key) => !SHOWN_KEYS.has(key))
  const verified = active.Source_Verified === true
  const hasMultiplePeriods = siblings.length > 1

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${record.Scheme || 'Scheme'} details`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="modal__header">
          <div className="modal__heading">
            <h2 className="modal__title">{record.Scheme || 'Unnamed scheme'}</h2>
            <p className="modal__sub">
              {[active.Town, active.Regional_Filter].filter(Boolean).join('  ·  ') || '—'}
            </p>
            <div className="modal__badges">
              {!isBlank(active.Source) && (
                <span className="badge badge--soft">{active.Source}</span>
              )}
              <span className={`badge ${verified ? 'badge--verified' : 'badge--muted'}`}>
                {verified ? 'Verified' : 'Unverified'}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="modal__close"
            aria-label="Close scheme details"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path
                fill="currentColor"
                d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3z"
              />
            </svg>
          </button>
        </header>

        {/* Period switcher (Scheme + Date_Filter). Toggle shows when >1 period. */}
        {hasMultiplePeriods ? (
          <div className="period-switch" role="tablist" aria-label="Reporting period">
            <span className="period-switch__label">Period</span>
            {siblings.map((s) => (
              <button
                key={s.Date_Filter || s.Id}
                type="button"
                role="tab"
                aria-selected={s.Date_Filter === active.Date_Filter}
                className={`period-chip${
                  s.Date_Filter === active.Date_Filter ? ' is-active' : ''
                }`}
                onClick={() => setActiveDate(s.Date_Filter)}
              >
                {s.Date_Filter || '—'}
              </button>
            ))}
          </div>
        ) : (
          !isBlank(active.Date_Filter) && (
            <div className="period-switch period-switch--single">
              <span className="period-switch__label">Period</span>
              <span className="period-chip is-active">{active.Date_Filter}</span>
            </div>
          )
        )}

        <div className="modal__body">
          <section className="modal__section">
            <h3 className="modal__section-title">Key metrics</h3>
            <div className="metric-grid">
              <Metric label="Units" value={dash(formatNumber(active.Units))} />
              <Metric label="Occupancy" value={dash(formatPercent(active.Occupancy))} />
              <Metric label="Stabilised" value={yesNo(active.Stabilised)} />
              <Metric label="Amenity grade" value={dash(active.Amenity_Grade)} />
              <Metric label="Launched" value={dash(active.Launched)} />
              <Metric label="Operator" value={dash(active.Operator)} />
            </div>
          </section>

          <section className="modal__section">
            <h3 className="modal__section-title">Rents by unit type</h3>
            <div className="rent-table-wrap">
              <table className="rent-table">
                <thead>
                  <tr>
                    <th scope="col">Unit type</th>
                    <th scope="col">Rent (pcm)</th>
                    <th scope="col">Size</th>
                    <th scope="col">£ psf</th>
                  </tr>
                </thead>
                <tbody>
                  {UNIT_ROWS.map((row) => (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      <td>{dash(formatRent(active[row.rent]))}</td>
                      <td>{sizeText(row.size)}</td>
                      <td>{dash(formatPsf(active[row.psf]))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="modal__section">
            <h3 className="modal__section-title">Location</h3>
            <SchemeMapPanel record={active} />
          </section>

          <section className="modal__section">
            <h3 className="modal__section-title">Scheme information</h3>
            <div className="info-grid">
              <InfoRow label="Amenities" value={dash(active.Amenities)} />
              <InfoRow label="Furnished" value={yesNo(active.Furnished)} />
              <InfoRow label="Height" value={dash(formatNumber(active.Height))} />
              <InfoRow label="Comparables from" value={dash(active.Comparables_From)} />
              <InfoRow label="Deals" value={dash(active.Deals)} />
              <InfoRow label="Comments" value={dash(active.Comments)} />
              <InfoRow label="Last updated by" value={dash(active.Last_Updated_By)} />
              <InfoRow label="Last updated at" value={dash(active.Last_Updated_At)} />
              <InfoRow label="Last modified" value={dash(formatDate(active['Last modified']))} />
            </div>
          </section>

          {additional.length > 0 && (
            <section className="modal__section">
              <h3 className="modal__section-title">Additional fields</h3>
              <div className="info-grid">
                {additional.map((key) => (
                  <InfoRow key={key} label={key} value={genericValue(active[key])} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
