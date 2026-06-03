// -----------------------------------------------------------------------------
// useRentalComps — fetches the live Ninox JSON on mount.
// -----------------------------------------------------------------------------
import { useCallback, useEffect, useState } from 'react'
import { NINOX_URL } from '../config/dataSource'

async function fetchComps() {
  const res = await fetch(NINOX_URL, { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    throw new Error(`Request failed (HTTP ${res.status} ${res.statusText})`)
  }
  const data = await res.json()
  if (!Array.isArray(data)) {
    throw new Error('Unexpected response format: expected a JSON array.')
  }
  return data
}

// Returns { status, records, error, reload }.
//   status: 'loading' | 'ready' | 'error'
export function useRentalComps() {
  const [status, setStatus] = useState('loading')
  const [records, setRecords] = useState([])
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      const data = await fetchComps()
      setRecords(data)
      setStatus('ready')
    } catch (err) {
      setError(err?.message || 'Unknown error')
      setStatus('error')
    }
  }, [])

  // Fetch fresh data every time the page loads / refreshes.
  useEffect(() => {
    reload()
  }, [reload])

  return { status, records, error, reload }
}
