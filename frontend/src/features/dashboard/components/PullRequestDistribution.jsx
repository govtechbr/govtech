import overview from '@/features/dashboard/OverviewPage.module.css'
import styles from './PullRequestDistribution.module.css'

const items = [
  { key: 'open', label: 'Abertos', description: 'Aguardando revisão ou merge (agora)' },
  { key: 'draft', label: 'Rascunhos', description: 'Ainda em construção (agora)' },
  { key: 'merged', label: 'Mergeados', description: 'Integrados no período' },
  { key: 'closed', label: 'Fechados', description: 'Fechados sem merge no período' },
]

// distribution: { open, draft, merged, closed } de governanceMetrics
export default function PullRequestDistribution({ distribution, days }) {
  const total = items.reduce((sum, { key }) => sum + distribution[key], 0)

  return (
    <div className={styles.root}>
      <small className="section-kicker">DISTRIBUIÇÃO · {days} DIAS</small>

      <p className={overview.total}>
        <strong>{total}</strong> Pull Requests
      </p>

      <ul className={overview.distribution}>
        {items.map(({ key, label, description }) => (
          <li key={key} className={overview[key]}>
            <span className={overview.dot} aria-hidden="true" />

            <div>
              <strong>{label}</strong>
              <small className={overview.muted}>{description}</small>
            </div>

            <strong>
              {distribution[key]}
              {total > 0 && ` · ${Math.round((distribution[key] / total) * 100)}%`}
            </strong>
          </li>
        ))}
      </ul>
    </div>
  )
}
