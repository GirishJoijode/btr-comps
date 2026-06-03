import { useEffect, useState } from 'react'
import {
  buildLocationQuery,
  geocodeRecord,
  getCoordinates,
  googleMapsSearchUrl,
  osmEmbedUrl,
  osmLinkUrl,
} from '../../utils/location'

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 2a7 7 0 0 0-7 7c0 4.6 5.6 11.3 6.3 12.1a.9.9 0 0 0 1.4 0C13.4 20.3 19 13.6 19 9a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z"
      />
    </svg>
  )
}

// Map / location section for the scheme detail modal.
// 1. Explicit coordinates on the record -> exact map.
// 2. Otherwise -> resolve an APPROXIMATE location via free OSM geocoding.
// 3. If geocoding fails -> clean location-search fallback.
export default function SchemeMapPanel({ record }) {
  const [state, setState] = useState({ status: 'loading' })

  useEffect(() => {
    const explicit = getCoordinates(record)
    if (explicit) {
      setState({ status: 'done', coords: explicit, approx: false })
      return
    }

    let active = true
    const controller = new AbortController()
    setState({ status: 'loading' })
    geocodeRecord(record, { signal: controller.signal })
      .then((hit) => {
        if (!active) return
        setState(
          hit
            ? { status: 'done', coords: { lat: hit.lat, lng: hit.lng }, approx: true }
            : { status: 'error' }
        )
      })
      .catch((err) => {
        if (active && err?.name !== 'AbortError') setState({ status: 'error' })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [record])

  const markerLine = [record?.Town, record?.Date_Filter].filter(Boolean).join(' · ')

  if (state.status === 'loading') {
    return (
      <div className="scheme-map">
        <div className="scheme-map__frame scheme-map__frame--loading">
          <span className="spinner" aria-hidden="true" />
          <span className="scheme-map__loading-text">Locating scheme…</span>
        </div>
      </div>
    )
  }

  if (state.status === 'done') {
    return (
      <div className="scheme-map">
        <iframe
          title={`Map showing ${record?.Scheme ?? 'scheme location'}`}
          className="scheme-map__frame"
          src={osmEmbedUrl(state.coords)}
          loading="lazy"
        />
        <div className="scheme-map__caption">
          <div className="scheme-map__marker">
            <strong>{record?.Scheme || 'Scheme'}</strong>
            {markerLine && <span>{markerLine}</span>}
          </div>
          <div className="scheme-map__actions">
            {state.approx && (
              <span className="badge badge--approx" title="Approximate location from scheme/town">
                Approximate
              </span>
            )}
            <a
              className="btn btn--ghost"
              href={osmLinkUrl(state.coords)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open full map
            </a>
          </div>
        </div>
      </div>
    )
  }

  // status === 'error' -> location search fallback
  const query = buildLocationQuery(record)
  return (
    <div className="location-fallback">
      <span className="location-fallback__pin" aria-hidden="true">
        <PinIcon />
      </span>
      <div className="location-fallback__body">
        <p className="location-fallback__query">{query || '—'}</p>
        <p className="location-fallback__note">
          Couldn’t resolve an automatic location. Search for the scheme instead.
        </p>
      </div>
      <a
        className="btn btn--primary location-fallback__btn"
        href={googleMapsSearchUrl(record)}
        target="_blank"
        rel="noopener noreferrer"
      >
        <PinIcon />
        Search location
      </a>
    </div>
  )
}
