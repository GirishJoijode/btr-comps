import { useEffect } from 'react'
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

export default function SchemeDetailModal({ record, onClose }) {
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
    isBlank(record[key]) ? DASH : `${formatNumber(Math.round(record[key]))} sq ft`

  const additional = Object.keys(record).filter((key) => !SHOWN_KEYS.has(key))

  const verified = record.Source_Verified === true

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
              {[record.Town, record.Regional_Filter, record.Date_Filter]
                .filter(Boolean)
                .join('  ·  ') || '—'}
            </p>
            <div className="modal__badges">
              {!isBlank(record.Source) && (
                <span className="badge badge--soft">{record.Source}</span>
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

        <div className="modal__body">
          <section className="modal__section">
            <h3 className="modal__section-title">Key metrics</h3>
            <div className="metric-grid">
              <Metric label="Units" value={dash(formatNumber(record.Units))} />
              <Metric label="Occupancy" value={dash(formatPercent(record.Occupancy))} />
              <Metric label="Stabilised" value={yesNo(record.Stabilised)} />
              <Metric label="Amenity grade" value={dash(record.Amenity_Grade)} />
              <Metric label="Launched" value={dash(record.Launched)} />
              <Metric label="Operator" value={dash(record.Operator)} />
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
                      <td>{dash(formatRent(record[row.rent]))}</td>
                      <td>{sizeText(row.size)}</td>
                      <td>{dash(formatPsf(record[row.psf]))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="modal__section">
            <h3 className="modal__section-title">Location</h3>
            <SchemeMapPanel record={record} />
          </section>

          <section className="modal__section">
            <h3 className="modal__section-title">Scheme information</h3>
            <div className="info-grid">
              <InfoRow label="Amenities" value={dash(record.Amenities)} />
              <InfoRow label="Furnished" value={yesNo(record.Furnished)} />
              <InfoRow label="Height" value={dash(formatNumber(record.Height))} />
              <InfoRow label="Comparables from" value={dash(record.Comparables_From)} />
              <InfoRow label="Deals" value={dash(record.Deals)} />
              <InfoRow label="Comments" value={dash(record.Comments)} />
              <InfoRow label="Last updated by" value={dash(record.Last_Updated_By)} />
              <InfoRow label="Last updated at" value={dash(record.Last_Updated_At)} />
              <InfoRow label="Last modified" value={dash(formatDate(record['Last modified']))} />
            </div>
          </section>

          {additional.length > 0 && (
            <section className="modal__section">
              <h3 className="modal__section-title">Additional fields</h3>
              <div className="info-grid">
                {additional.map((key) => (
                  <InfoRow key={key} label={key} value={genericValue(record[key])} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
