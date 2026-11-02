import { useState } from 'react'
import { Target } from 'lucide-react'

import AutomatedAlerts from '@/features/dashboard/components/AutomatedAlerts'
import GovernanceIndex from '@/features/dashboard/components/GovernanceIndex'
import ProjectStatusSummary from '@/features/dashboard/components/ProjectStatusSummary'
import PullRequestDistribution from '@/features/dashboard/components/PullRequestDistribution'
import PullRequestFlowChart from '@/features/dashboard/components/PullRequestFlowChart'
import RecentActivityPanel from '@/features/dashboard/components/RecentActivityPanel'
import styles from '@/features/dashboard/OverviewPage.module.css'
import { COLORS } from '@/shared/constants/colors'
import { PROJECT_STATUS } from '@/shared/constants/projectStatus'
import { formatDuration } from '@/shared/lib/date'
import {
  DEFAULT_PERIOD,
  emptyGovernance,
  governanceAlerts,
  governanceMetrics,
  PERIODS,
  projectHealth,
  weeklyFlow,
} from '@/shared/lib/governance'
import { formatProjectDate } from '@/shared/lib/projectUtils'
import StatCard from '@/shared/ui/StatCard'

const statusOrder = { danger: 0, warning: 1, success: 2 }

// governance: dados sincronizados do GitHub (vêm por prop do adaptador em app/routes.jsx)
export default function OverviewPage({ projectList, governance = emptyGovernance, isLoading }) {
  const [days, setDays] = useState(DEFAULT_PERIOD)
  const now = new Date()

  const metrics = governanceMetrics(governance, days, now)
  const alerts = governanceAlerts(governance, projectList, now)
  const health = projectHealth(projectList, governance, now)
  // Pelo menos 4 semanas no gráfico, para a tendência aparecer mesmo no período de 7 dias
  const weeks = weeklyFlow(governance.pullRequests, Math.max(4, Math.ceil(days / 7)), now)
  const noGitHub = !isLoading && governance.repositories.length === 0

  const projects = [...projectList].sort(
    (a, b) => statusOrder[health[a.id].status] - statusOrder[health[b.id].status],
  )

  return (
    <main className="dashboard-content">
      <div className={styles.toolbar}>
        <p className={styles.muted}>
          {isLoading
            ? 'Carregando os dados do GitHub…'
            : noGitHub
              ? 'Nenhum repositório sincronizado: conecte o GitHub em um projeto para ver as métricas.'
              : 'Calculado dos dados sincronizados do GitHub (atualiza a cada hora).'}
        </p>

        <div className={styles.periods} role="group" aria-label="Período">
          {PERIODS.map((period) => (
            <button
              key={period}
              type="button"
              className={styles.period}
              aria-pressed={days === period}
              onClick={() => setDays(period)}
            >
              {period} dias
            </button>
          ))}
        </div>
      </div>

      <GovernanceIndex scores={governance.scores} />

      <ProjectStatusSummary health={health} />

      <div className={`metric-grid ${styles.metrics}`}>
        <StatCard
          title="Quantidade de PRs"
          value={metrics.pullRequestCount}
          subtext={`Abertos agora + criados em ${days} dias`}
          icon="GitPullRequest"
          color={COLORS.info}
        />

        <StatCard
          title="Lead time médio"
          value={formatDuration(metrics.leadTimeHours)}
          subtext="Da abertura ao merge"
          icon="TimerReset"
          color={COLORS.primary}
        />

        <StatCard
          title="Taxa de aprovação"
          value={metrics.approvalRate === null ? '—' : `${metrics.approvalRate}%`}
          subtext={
            metrics.approvalRate === null
              ? 'Nenhum PR mergeado no período'
              : 'Mergeados com ao menos 1 aprovação'
          }
          icon="ShieldCheck"
          color={COLORS.success}
        />

        <StatCard
          title="PRs em risco"
          value={metrics.atRiskCount}
          subtext="Abertos há mais de 3 dias"
          icon="Bell"
          color={COLORS.danger}
        />

        <StatCard
          title="CI verde no merge"
          value={metrics.ciSuccessRate === null ? '—' : `${metrics.ciSuccessRate}%`}
          subtext={
            metrics.ciSuccessRate === null
              ? 'Nenhum PR mergeado com CI no período'
              : 'Mergeados com os testes automáticos verdes'
          }
          icon="Zap"
          color={COLORS.success}
        />
      </div>

      <section className={`panel elevation-1 ${styles.section}`}>
        <div className="panel-heading">
          <div>
            <span className="section-kicker">FLUXO DE ENTREGAS</span>
            <h2>Evolução das Pull Requests</h2>
          </div>
        </div>

        <div className={styles.flowGrid}>
          <PullRequestFlowChart weeks={weeks} />
          <PullRequestDistribution distribution={metrics.distribution} days={days} />
        </div>
      </section>

      <section className={`panel elevation-1 ${styles.section}`}>
        <div className="panel-heading">
          <div>
            <span className="section-kicker">PORTFÓLIO DE PROJETOS</span>
            <h2>Status dos Projetos Monitorados</h2>
          </div>

          <Target size={21} />
        </div>

        <div className={styles.projectList}>
          {projects.map((project) => {
            const { status, alerts: projectAlerts } = health[project.id]

            return (
              <article
                key={project.id}
                className={`elevation-1 ${styles.projectRow} ${styles[status]}`}
              >
                <span className={styles.statusDot} aria-hidden="true" />

                <div>
                  <strong className={styles.projectName}>{project.name}</strong>

                  <small className={styles.muted}>
                    Deadline: {formatProjectDate(project.deadline)} · {project.owner}
                  </small>
                </div>

                <div className={styles.deadline}>
                  <strong className={styles.deadlineLabel}>{PROJECT_STATUS[status]}</strong>

                  <small className={styles.muted}>
                    {projectAlerts.length === 0
                      ? 'Nenhum alerta'
                      : `${projectAlerts.length} alerta(s): ${projectAlerts[0].title}`}
                  </small>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className={styles.bottomGrid}>
        <AutomatedAlerts alerts={alerts} />
        <RecentActivityPanel events={metrics.events} days={days} />
      </section>
    </main>
  )
}
