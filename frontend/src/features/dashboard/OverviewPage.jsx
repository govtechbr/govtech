import { Target } from 'lucide-react'

import { COLORS } from '@/shared/constants/colors'
import { pullRequests } from '@/mocks/mockData'
import StatCard from '@/shared/ui/StatCard'
import ProjectStatusSummary from './components/ProjectStatusSummary'
import PullRequestFlowChart from './components/PullRequestFlowChart'
import PullRequestDistribution from './components/PullRequestDistribution'
import AutomatedAlerts from './components/AutomatedAlerts'
import RecentActivityPanel from './components/RecentActivityPanel'
import { formatProjectDate, getProjectStatus } from '@/shared/lib/projectUtils'
import styles from './OverviewPage.module.css'

export default function OverviewPage({ projectList }) {
  const prSummary = {
    open: pullRequests.filter((pr) => pr.status === 'open').length,
    inReview: pullRequests.filter((pr) => pr.status === 'in_review').length,
    approved: pullRequests.filter((pr) => pr.status === 'approved').length,
    merged: pullRequests.filter((pr) => pr.status === 'merged').length,
    total: pullRequests.length,
  }

  const approvalRate = Math.round(((prSummary.approved + prSummary.merged) / prSummary.total) * 100)

  const projectsWithStatus = projectList
    .map((project) => ({
      ...project,
      calculatedStatus: getProjectStatus(project),
    }))
    .sort((a, b) => {
      const order = {
        delayed: 1,
        at_risk: 2,
        on_track: 3,
      }

      return order[a.calculatedStatus.semanticKey] - order[b.calculatedStatus.semanticKey]
    })

  return (
    <main className="dashboard-content">
      <ProjectStatusSummary projectList={projectList} />

      <div className="metric-grid">
        <StatCard
          title="PRs integradas"
          value={prSummary.merged}
          subtext="Pull Requests concluídas"
          icon="GitPullRequest"
          trend={20}
          color={COLORS.success}
        />

        <StatCard
          title="Lead time médio"
          value="4.2 dias"
          subtext="Meta: até 5 dias"
          icon="TimerReset"
          trend={-12}
          color={COLORS.primary}
        />

        <StatCard
          title="Taxa de aprovação"
          value={`${approvalRate}%`}
          subtext="Aprovadas ou integradas"
          icon="ShieldCheck"
          trend={8}
          color={COLORS.info}
        />

        <StatCard
          title="Alertas ativos"
          value="3"
          subtext="1 crítico e 2 de atenção"
          icon="Bell"
          trend={-25}
          color={COLORS.warning}
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
          <PullRequestFlowChart />

          <PullRequestDistribution
            open={prSummary.open}
            inReview={prSummary.inReview}
            approved={prSummary.approved}
            merged={prSummary.merged}
          />
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
          {projectsWithStatus.map((project) => {
            const status = project.calculatedStatus

            return (
              <article
                key={project.id}
                className={`elevation-1 ${styles.projectRow} ${styles[status.key]}`}
              >
                <span className={styles.statusIcon} aria-hidden="true">
                  {status.icon}
                </span>

                <div>
                  <strong className={styles.projectName}>{project.name}</strong>

                  <small className={styles.muted}>
                    Deadline: {formatProjectDate(project.deadline)} · {project.owner}
                  </small>
                </div>

                <div className={styles.deadline}>
                  <strong className={styles.deadlineLabel}>{status.label}</strong>

                  <small className={styles.muted}>{status.message}</small>
                </div>

                <div className={styles.progress}>
                  <strong>{project.progress}%</strong>
                  <small className={styles.muted}>progresso</small>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className={styles.bottomGrid}>
        <AutomatedAlerts />
        <RecentActivityPanel />
      </section>
    </main>
  )
}
