import {
  AlertTriangle,
  Bell,
  Check,
  Target,
} from 'lucide-react'

import { COLORS } from '../constants/colors'
import { pullRequests } from '../data/mockData'
import StatCard from '../components/common/StatCard'
import ProjectStatusSummary from '../components/dashboard/ProjectStatusSummary'
import PullRequestFlowChart from '../components/dashboard/PullRequestFlowChart'
import PullRequestDistribution from '../components/dashboard/PullRequestDistribution'
import AutomatedAlerts from '../components/dashboard/AutomatedAlerts'
import RecentActivityPanel from '../components/dashboard/RecentActivityPanel'
import { formatProjectDate, getProjectStatus } from '../utils/projectUtils'

export default function OverviewPage({ projectList }) {
  const prSummary = {
    open: pullRequests.filter((pr) => pr.status === 'open').length,
    inReview: pullRequests.filter((pr) => pr.status === 'in_review').length,
    approved: pullRequests.filter((pr) => pr.status === 'approved').length,
    merged: pullRequests.filter((pr) => pr.status === 'merged').length,
    total: pullRequests.length,
  }

  const approvalRate = Math.round(
    ((prSummary.approved + prSummary.merged) / prSummary.total) * 100
  )

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

      return (
        order[a.calculatedStatus.semanticKey] -
        order[b.calculatedStatus.semanticKey]
      )
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

      <section className="panel elevation-1" style={{ marginTop: '24px' }}>
        <div className="panel-heading">
          <div>
            <span className="section-kicker">FLUXO DE ENTREGAS</span>
            <h2>Evolução das Pull Requests</h2>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.65fr) minmax(260px, 0.75fr)',
            gap: '28px',
            padding: '16px 0 4px',
          }}
        >
          <PullRequestFlowChart />

          <PullRequestDistribution
            open={prSummary.open}
            inReview={prSummary.inReview}
            approved={prSummary.approved}
            merged={prSummary.merged}
          />
        </div>
      </section>

      <section className="panel elevation-1" style={{ marginTop: '24px' }}>
        <div className="panel-heading">
          <div>
            <span className="section-kicker">PORTFÓLIO DE PROJETOS</span>
            <h2>Status dos Projetos Monitorados</h2>
          </div>

          <Target size={21} />
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          {projectsWithStatus.map((project) => {
            const status = project.calculatedStatus

            return (
              <article
                key={project.id}
                className="metric-card elevation-1"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '15px 16px',
                  borderTop: 'none',
                  borderLeft: `4px solid ${status.color}`,
                }}
              >
                <span style={{ fontSize: '20px' }}>{status.icon}</span>

                <div style={{ flex: 1 }}>
                  <strong style={{ display: 'block', fontSize: '14px' }}>
                    {project.name}
                  </strong>

                  <small style={{ color: 'var(--muted)' }}>
                    Deadline: {formatProjectDate(project.deadline)} ·{' '}
                    {project.owner}
                  </small>
                </div>

                <div style={{ minWidth: '130px', textAlign: 'right' }}>
                  <strong
                    style={{
                      display: 'block',
                      color: status.color,
                      fontSize: '13px',
                    }}
                  >
                    {status.label}
                  </strong>

                  <small style={{ color: 'var(--muted)' }}>
                    {status.message}
                  </small>
                </div>

                <div style={{ width: '70px', textAlign: 'right' }}>
                  <strong>{project.progress}%</strong>
                  <small
                    style={{
                      display: 'block',
                      color: 'var(--muted)',
                    }}
                  >
                    progresso
                  </small>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '24px',
          marginTop: '24px',
        }}
      >
        <AutomatedAlerts />
        <RecentActivityPanel />
      </section>
    </main>
  )
}