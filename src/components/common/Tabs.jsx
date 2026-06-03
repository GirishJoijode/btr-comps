// Simple tab switcher used in the header.
export default function Tabs({ tabs, active, onChange, disabled }) {
  return (
    <nav className="tabs" aria-label="Views">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`tab ${active === t.id ? 'is-active' : ''}`}
          aria-current={active === t.id ? 'page' : undefined}
          onClick={() => onChange(t.id)}
          disabled={disabled}
        >
          {t.label}
        </button>
      ))}
    </nav>
  )
}
