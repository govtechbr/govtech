// Mesmo visual dos cartões que a página já usava (classes globais metric-*)
export default function MetricCard({ icon: MetricIcon, label, value, hint }) {
  return (
    <article className="metric-card elevation-1">
      <div className="metric-icon">
        <MetricIcon size={19} />
      </div>

      <div className="metric-content">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{hint}</small>
      </div>
    </article>
  )
}
