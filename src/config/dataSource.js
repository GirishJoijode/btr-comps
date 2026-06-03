// -----------------------------------------------------------------------------
// Data source configuration
// -----------------------------------------------------------------------------
// The Ninox shared JSON URL lives here in ONE obvious place.
//
// To move it to an environment variable later, create a `.env` file with:
//   VITE_NINOX_URL=https://...
// and Vite will pick it up automatically via `import.meta.env.VITE_NINOX_URL`.
// -----------------------------------------------------------------------------

const DEFAULT_NINOX_URL =
  'https://savills.ninoxdb.com/share/na75mz3581lj9w4isquh9j1ycwbn1dbqr3qs?locale=en-gb&utcoffset=60'

export const NINOX_URL = import.meta.env.VITE_NINOX_URL || DEFAULT_NINOX_URL
