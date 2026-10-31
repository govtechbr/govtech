import {
  Check,
  GitFork,
  GitPullRequest,
} from 'lucide-react'

import { COLORS } from '../../constants/colors'
import { repoStats } from '../../data/mockData'

export default function RecentActivityPanel() {
  return (
    <section className="panel repo-panel elevation-1">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">ATIVIDADE RECENTE</span>
          <h2>Eventos de Desenvolvimento</h2>
        </div>

        <GitFork size={21} />
      </div>

      <div className="repo-stats">
        <div>
          <span>{repoStats.repositories}</span>
          <small>Repositórios</small>
        </div>

        <div>
          <span>{repoStats.commits}</span>
          <small>Commits</small>
        </div>

        <div>
          <span>{repoStats.branches}</span>
          <small>Branches</small>
        </div>

        <div>
          <span>{repoStats.contributors}</span>
          <small>Contribuidores</small>
        </div>
      </div>

      <div className="commit-line">
        <span className="commit-avatar">AS</span>

        <span>
          <b>ana.silva</b> criou PR{' '}
          <strong>#856 · feature/payment-gateway</strong>
          <small className="mono">identity-gateway · 8 min atrás</small>
        </span>

        <GitPullRequest size={15} style={{ color: COLORS.info }} />
      </div>

      <div className="commit-line">
        <span className="commit-avatar teal">CM</span>

        <span>
          <b>carlos.melo</b> aprovou PR{' '}
          <strong>#842 · fix/billing-logic</strong>
          <small className="mono">
            billing-orchestrator · 21 min atrás
          </small>
        </span>

        <Check size={15} style={{ color: COLORS.success }} />
      </div>
    </section>
  )
}