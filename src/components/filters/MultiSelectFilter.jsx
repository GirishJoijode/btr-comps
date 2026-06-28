import { useEffect, useRef, useState } from 'react'

function selectionLabel(selected) {
  if (!selected.length) return 'All'
  if (selected.length === 1) return selected[0]
  return `${selected.length} selected`
}

export default function MultiSelectFilter({ fieldKey, label, options, value, onChange }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const selected = value ?? []
  const labelId = `ms-label-${fieldKey}`

  useEffect(() => {
    if (!open) return
    const close = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('touchstart', close)
    }
  }, [open])

  const toggle = (opt) => {
    onChange(
      selected.includes(opt) ? selected.filter((v) => v !== opt) : [...selected, opt]
    )
  }

  const summary = selectionLabel(selected)
  const fullTitle = selected.length > 1 ? selected.join(', ') : undefined

  return (
    <div className="field ms-filter" ref={rootRef}>
      <span className="field__label" id={labelId}>
        {label}
      </span>
      <button
        type="button"
        className={`ms-filter__trigger field__input${open ? ' is-open' : ''}${
          selected.length ? ' has-selection' : ''
        }`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={labelId}
      >
        <span className="ms-filter__value" title={fullTitle}>
          {summary}
        </span>
        <span className="ms-filter__chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="ms-filter__menu" role="listbox" aria-multiselectable="true">
          <button
            type="button"
            className="ms-filter__clear"
            onClick={() => onChange([])}
            disabled={selected.length === 0}
          >
            Clear — show all
          </button>
          <ul className="ms-filter__list">
            {(options || []).map((opt) => (
              <li key={opt}>
                <label className="ms-filter__option">
                  <input
                    type="checkbox"
                    checked={selected.includes(opt)}
                    onChange={() => toggle(opt)}
                  />
                  <span className="ms-filter__option-text" title={opt}>
                    {opt}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
