import { Clock3, GitMerge, GitPullRequest } from 'lucide-react'

import MetricCard from '@/features/repositories/components/MetricCard'
import styles from '@/features/repositories/RepositoriesPage.module.css'
import { pullRequestMetrics } from '@/features/repositories/utils/metrics'
import { formatDuration, timeAgo } from '@/shared/lib/date'
import StatusBadge from '@/shared/ui/StatusBadge'

const states = {
  open: { label: 'Aberto', status: 'warning' },
  merged: { label: 'Mergeado', status: 'success' },
  closed: { label: 'Fechado', status: 'default' },
}

export default function PullRequestsList({ pullRequests }) {
  const metrics = pullRequestMetrics(pullRequests)

  return (
    <>
      <section className="metrics-grid">
        <MetricCard
          icon={GitPullRequest}
          label="PRs abertos"
          value={metrics.open}
          hint="Demandam acompanhamento"
        />
        <MetricCard
          icon={GitMerge}
          label="Mergeados"
          value={metrics.mergedLast30Days}
          hint="Últimos 30 dias"
        />
        <MetricCard
          icon={Clock3}
          label="Tempo médio até o merge"
          value={formatDuration(metrics.averageMergeHours)}
          hint="PRs mergeados nos últimos 30 dias"
        />
      </section>

      <section className="panel elevation-1">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">MONITORAMENTO DE ENTREGAS</span>
            <h2>Pull Requests</h2>
            <p>Os 100 mais recentes de cada repositório, na última sincronização.</p>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>PULL REQUEST</th>
                <th>REPOSITÓRIO</th>
                <th>AUTOR</th>
                <th>ABERTO</th>
                <th>STATUS</th>
              </tr>
            </thead>

            <tbody>
              {pullRequests.map((pr) => (
                <tr key={pr.id}>
                  <td>
                    <div className="service-name">
                      <span className="avatar">
                        <GitPullRequest size={15} />
                      </span>

                      <a
                        className={styles.link}
                        href={pr.html_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        #{pr.number} — {pr.title}
                      </a>
                    </div>
                  </td>

                  <td className="mono">{pr.repository.name}</td>
                  <td>{pr.author_login ?? '—'}</td>
                  <td className="muted-cell">{timeAgo(pr.created_at_github)}</td>
                  <td>
                    <StatusBadge status={states[pr.state].status}>
                      {pr.draft && pr.state === 'open' ? 'Rascunho' : states[pr.state].label}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
