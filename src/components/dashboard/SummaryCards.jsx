import { formatDate, formatNumber } from '../../utils/formatters'

export default function SummaryCards({ summary }) {
  const cards = [
    { label: 'Total records', value: formatNumber(summary.total) || '0' },
    { label: 'Unique schemes', value: formatNumber(summary.schemes) || '0' },
    { label: 'Current quarter', value: summary.currentQuarter || 'N/A' },
    {
      label: 'Last updated',
      value: summary.lastModified ? formatDate(summary.lastModified) : '—',
    },
  ]

  return (
    <section className="summary-grid" aria-label="Summary statistics">
      {cards.map((card) => (
        <div className="summary-card" key={card.label}>
          <span className="summary-card__value">{card.value}</span>
          <span className="summary-card__label">{card.label}</span>
        </div>
      ))}
    </section>
  )
}
