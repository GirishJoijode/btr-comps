// -----------------------------------------------------------------------------
// Map View tab
// -----------------------------------------------------------------------------
// Plots the same (already filtered, latest-per-scheme) rows that the table shows,
// using the Latitude / Longitude supplied by the data source. No geocoding, no
// address lookups, no caching — coordinates are read straight from each record
// via getCoordinates(). Markers feed the SAME global selection + detail modal as
// the table, so the three tabs stay in sync.
// -----------------------------------------------------------------------------
import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getCoordinates } from '../../utils/location'
import { formatRent } from '../../utils/formatters'

// Roughly centres the UK before the first fit-to-bounds runs.
const UK_CENTER = [53.2, -1.6]

// Themed teardrop markers (divIcon = no broken default-icon image paths under
// Vite, and lets us colour the selected state without extra assets).
const baseIcon = L.divIcon({
  className: 'map-pin-icon',
  html: '<span class="map-pin"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
  popupAnchor: [0, -20],
})
const selectedIcon = L.divIcon({
  className: 'map-pin-icon',
  html: '<span class="map-pin map-pin--selected"></span>',
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  popupAnchor: [0, -24],
})

function clusterIcon(cluster) {
  const count = cluster.getChildCount()
  const size = count < 10 ? 'sm' : count < 50 ? 'md' : 'lg'
  return L.divIcon({
    html: `<span>${count}</span>`,
    className: `map-cluster map-cluster--${size}`,
    iconSize: L.point(42, 42, true),
    iconAnchor: L.point(21, 21),
  })
}

// Refit the view to the plotted points, but only when the SET of points changes
// (i.e. when filters change) — keyed on the id signature. Selection toggles do
// NOT change the signature, so selecting a scheme never moves the map.
function FitBounds({ signature, bounds }) {
  const map = useMap()
  useEffect(() => {
    if (!bounds) return
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])
  return null
}

export default function MapView({ records, selectedIds, onToggleRow, onRowClick, onClearSelection }) {
  // Read coordinates once per filtered set. Records without usable lat/lng are
  // skipped (never plotted) and counted as "unplotted".
  const points = useMemo(() => {
    const out = []
    for (const rec of records) {
      const coords = getCoordinates(rec)
      if (coords) out.push({ id: rec.Id, rec, lat: coords.lat, lng: coords.lng })
    }
    return out
  }, [records])

  const unplotted = records.length - points.length
  const signature = useMemo(() => points.map((p) => p.id).join('|'), [points])
  const bounds = useMemo(
    () => (points.length ? L.latLngBounds(points.map((p) => [p.lat, p.lng])) : null),
    [points]
  )

  // Marker elements only rebuild when the plotted set or the selection changes,
  // so unrelated re-renders don't churn the cluster layer.
  const markers = useMemo(
    () =>
      points.map(({ id, rec, lat, lng }) => {
        const selected = selectedIds.has(id)
        const sub = [rec.Town, rec.Regional_Filter, rec.Date_Filter]
          .filter(Boolean)
          .join(' · ')
        return (
          <Marker key={id} position={[lat, lng]} icon={selected ? selectedIcon : baseIcon}>
            <Popup>
              <div className="map-popup">
                <h4 className="map-popup__title">{rec.Scheme || 'Unnamed scheme'}</h4>
                {sub && <p className="map-popup__sub">{sub}</p>}
                <dl className="map-popup__rents">
                  <div>
                    <dt>Studio</dt>
                    <dd>{formatRent(rec.Studio_Rent) || '—'}</dd>
                  </div>
                  <div>
                    <dt>1 Bed</dt>
                    <dd>{formatRent(rec.Bed1_Rent) || '—'}</dd>
                  </div>
                  <div>
                    <dt>2 Bed</dt>
                    <dd>{formatRent(rec.Bed2_Rent) || '—'}</dd>
                  </div>
                  <div>
                    <dt>3 Bed</dt>
                    <dd>{formatRent(rec.Bed3_Rent) || '—'}</dd>
                  </div>
                </dl>
                <div className="map-popup__actions">
                  <button
                    type="button"
                    className={`btn btn--sm ${selected ? 'btn--primary' : 'btn--ghost'}`}
                    onClick={() => onToggleRow(id)}
                  >
                    {selected ? 'Selected ✓' : 'Select'}
                  </button>
                  <button
                    type="button"
                    className="btn btn--sm btn--ghost"
                    onClick={() => onRowClick(rec)}
                  >
                    View details
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        )
      }),
    [points, selectedIds, onToggleRow, onRowClick]
  )

  return (
    <div className="tab-panel map-panel">
      <div className="map-toolbar">
        <span className="map-toolbar__count">
          {points.length.toLocaleString('en-GB')} scheme{points.length === 1 ? '' : 's'} mapped
        </span>
        {unplotted > 0 && (
          <span className="map-toolbar__chip map-toolbar__chip--muted">
            {unplotted.toLocaleString('en-GB')} without coordinates
          </span>
        )}
        {selectedIds.size > 0 && (
          <span className="map-toolbar__chip map-toolbar__chip--accent">
            {selectedIds.size.toLocaleString('en-GB')} selected
          </span>
        )}
        <div className="map-toolbar__actions">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={onClearSelection}
            disabled={selectedIds.size === 0}
          >
            Clear selection
          </button>
        </div>
      </div>

      <div className="map-wrap">
        {points.length === 0 ? (
          <div className="map-empty">
            No schemes with coordinates in the current selection.
          </div>
        ) : (
          <MapContainer center={UK_CENTER} zoom={6} className="map-canvas" scrollWheelZoom>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MarkerClusterGroup
              chunkedLoading
              showCoverageOnHover={false}
              maxClusterRadius={50}
              iconCreateFunction={clusterIcon}
            >
              {markers}
            </MarkerClusterGroup>
            <FitBounds signature={signature} bounds={bounds} />
          </MapContainer>
        )}
      </div>
    </div>
  )
}
