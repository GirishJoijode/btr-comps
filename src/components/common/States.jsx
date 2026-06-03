export function Loading() {
  return (
    <div className="state state--loading" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p>Loading live rental comparables…</p>
    </div>
  )
}

export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="state state--error" role="alert">
      <h2>Unable to load data</h2>
      <p>{message}</p>
      <p className="state__hint">
        This can happen if the source is unreachable or blocks cross-origin
        requests from the browser. Check your connection and try again.
      </p>
      {onRetry && (
        <button type="button" className="btn btn--primary" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  )
}
