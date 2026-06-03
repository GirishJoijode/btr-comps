// Consistent card shell for every analysis chart.
export default function ChartCard({ title, subtitle, className = '', empty, children }) {
  return (
    <div className={`panel chart-card ${className}`}>
      <div className="panel__head">
        <h3 className="panel__title">{title}</h3>
        {subtitle && <span className="panel__subtitle">{subtitle}</span>}
      </div>
      <div className="panel__body chart-card__body">
        {empty ? (
          <div className="chart-empty">No data for the current selection.</div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
