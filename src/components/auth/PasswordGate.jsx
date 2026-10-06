import { useEffect, useId, useRef, useState } from 'react'
import { persistAuthentication, verifyPassword } from '../../utils/auth'

export default function PasswordGate({ onSuccess }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const labelId = useId()
  const errorId = useId()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const ok = await verifyPassword(password)
      if (!ok) {
        setError('Incorrect password. Please try again.')
        return
      }
      persistAuthentication()
      onSuccess()
    } catch (err) {
      const missing = String(err?.message || '').includes('VITE_APP_PASSWORD_HASH')
      setError(
        missing
          ? 'Authentication is not configured. Missing VITE_APP_PASSWORD_HASH.'
          : 'Could not check the password. Refresh the page and try again.',
      )
    }
  }

  return (
    <div className="auth-gate">
      <div className="auth-gate__panel">
        <div className="auth-gate__brand">
          <span className="auth-gate__mark" aria-hidden="true" />
          <div>
            <h1 className="auth-gate__title">BTR Rental and Cost Analytics</h1>
          </div>
        </div>

        <p className="auth-gate__copy">
          Enter the password to access the BTR analytics platform.
        </p>

        <form className="auth-gate__form" onSubmit={handleSubmit} noValidate>
          <label className="auth-gate__label" htmlFor={labelId}>
            Password
          </label>
          <div className="auth-gate__field">
            <input
              ref={inputRef}
              id={labelId}
              type={showPassword ? 'text' : 'password'}
              className="auth-gate__input"
              value={password}
              autoComplete="current-password"
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? errorId : undefined}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) setError('')
              }}
            />
            <button
              type="button"
              className="auth-gate__toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {error && (
            <p className="auth-gate__error" id={errorId} role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn--primary auth-gate__submit">
            Access Platform
          </button>
        </form>
      </div>
    </div>
  )
}
