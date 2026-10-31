import Icon from './Icon'

export default function StatCard({
  title,
  value,
  subtext,
  icon,
  trend,
  color = '#9370DB',
}) {
  return (
    <article className="metric-card elevation-1">
      <div className="metric-icon" style={{ background: `${color}20` }}>
        <Icon name={icon} size={18} style={{ color }} />
      </div>

      <div className="metric-content">
        <span>{title}</span>
        <div className="metric-value">{value}</div>

        {subtext && (
          <small style={{ color: 'var(--muted)' }}>{subtext}</small>
        )}

        {typeof trend === 'number' && (
          <div className="metric-foot">
            <span className={trend >= 0 ? 'delta-positive' : 'delta-negative'}>
              {trend > 0 ? '+' : ''}
              {trend}%
            </span>
          </div>
        )}
      </div>
    </article>
  )
}