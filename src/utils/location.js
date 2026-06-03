// -----------------------------------------------------------------------------
// Location / map helpers
// -----------------------------------------------------------------------------
// The Ninox JSON may or may not include coordinates. These helpers detect usable
// lat/lng under common field names and, when absent, build a free Google Maps
// search query from descriptive fields. No API keys, no paid geocoding.
// -----------------------------------------------------------------------------

const LAT_KEYS = ['Latitude', 'latitude', 'Lat', 'lat', 'LAT']
const LNG_KEYS = ['Longitude', 'longitude', 'Lng', 'lng', 'Lon', 'lon', 'LNG']

function firstFiniteNumber(record, keys) {
  if (!record) return null
  for (const key of keys) {
    const raw = record[key]
    if (raw === null || raw === undefined || raw === '') continue
    const n = Number(raw)
    if (Number.isFinite(n)) return n
  }
  return null
}

// Returns { lat, lng } when the record has usable coordinates, otherwise null.
export function getCoordinates(record) {
  const lat = firstFiniteNumber(record, LAT_KEYS)
  const lng = firstFiniteNumber(record, LNG_KEYS)
  if (lat === null || lng === null) return null
  // Reject out-of-range and the 0,0 "null island" placeholder.
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  if (lat === 0 && lng === 0) return null
  return { lat, lng }
}

// Human-readable search query: Scheme, Town, Regional_Filter, Operator.
export function buildLocationQuery(record) {
  return [record?.Scheme, record?.Town, record?.Regional_Filter, record?.Operator]
    .map((part) => (part == null ? '' : String(part).trim()))
    .filter(Boolean)
    .join(', ')
}

// Free Google Maps search link (opens in a new tab; no API key required).
export function googleMapsSearchUrl(record) {
  const query = buildLocationQuery(record) || record?.Scheme || ''
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

// Free OpenStreetMap embed (iframe) centred on the coordinates with a marker.
// No dependency and no API key needed.
export function osmEmbedUrl({ lat, lng }) {
  const d = 0.008
  const bbox = [lng - d, lat - d, lng + d, lat + d].join('%2C')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`
}

// Link to the full OpenStreetMap page for the coordinates.
export function osmLinkUrl({ lat, lng }) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`
}

// -----------------------------------------------------------------------------
// Approximate geocoding (free, no API key)
// -----------------------------------------------------------------------------
// Uses the OpenStreetMap Nominatim service to resolve an APPROXIMATE location
// from the scheme name / town when the record has no explicit coordinates.
// Nominatim is free and keyless; results are cached per query for the session
// to be a good citizen (its usage policy asks for low request volumes).
// -----------------------------------------------------------------------------

const geocodeCache = new Map()

// Candidate queries, most specific first.
export function buildGeocodeQueries(record) {
  const scheme = record?.Scheme ? String(record.Scheme).trim() : ''
  const town = record?.Town ? String(record.Town).trim() : ''
  const queries = []
  if (scheme && town) queries.push(`${scheme}, ${town}, United Kingdom`)
  if (town) queries.push(`${town}, United Kingdom`)
  if (scheme && !town) queries.push(`${scheme}, United Kingdom`)
  return queries
}

async function lookup(query, signal) {
  if (geocodeCache.has(query)) return geocodeCache.get(query)
  const url =
    'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=' +
    encodeURIComponent(query)
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!res.ok) {
    geocodeCache.set(query, null)
    return null
  }
  const data = await res.json()
  const hit =
    Array.isArray(data) && data.length > 0
      ? { lat: Number(data[0].lat), lng: Number(data[0].lon), label: data[0].display_name }
      : null
  geocodeCache.set(query, hit)
  return hit
}

// Resolve an approximate { lat, lng, label, query } for a record, or null.
export async function geocodeRecord(record, { signal } = {}) {
  for (const query of buildGeocodeQueries(record)) {
    try {
      const hit = await lookup(query, signal)
      if (hit) return { ...hit, query }
    } catch (err) {
      if (err?.name === 'AbortError') throw err
      // Network/other error: try the next, less specific query.
    }
  }
  return null
}
