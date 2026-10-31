import {
  Clock3,
  GitPullRequest,
  MessageSquareText,
  UserRound,
} from 'lucide-react'

const pullRequests = [
  {
    id: '#482',
    title: 'Implementa indicadores de governança',
    repository: 'govtech-dashboard',
    author: 'Ana Silva',
    reviewers: 2,
    age: '2h',
    status: 'Em revisão',
    variant: 'warning',
  },
  {
    id: '#479',
    title: 'Adiciona trilha de auditoria',
    repository: 'govtech-api',
    author: 'Carlos Melo',
    reviewers: 3,
    age: '5h',
    status: 'Aprovada',
    variant: 'success',
  },
  {
    id: '#476',
    title: 'Ajusta alerta de pipeline',
    repository: 'notification-service',
    author: 'João Santos',
    reviewers: 1,
    age: '2 dias',
    status: 'Atenção',
    variant: 'danger',
  },
  {
    id: '#471',
    title: 'Refatora integração com GitHub',
    repository: 'governance-engine',
    author: 'Marina Costa',
    reviewers: 2,
    age: '1 dia',
    status: 'Em revisão',
    variant: 'warning',
  },
]

export default function PullRequestsList() {
  return (
    <>
      <section className="metrics-grid">
        <article className="metric-card elevation-1">
          <div className="metric-icon">
            <GitPullRequest size={19} />
          </div>

          <div className="metric-content">
            <span>PRs abertas</span>
            <strong>10</strong>
            <small>Demandam acompanhamento</small>
          </div>
        </article>

        <article className="metric-card elevation-1">
          <div className="metric-icon">
            <Clock3 size={19} />
          </div>

          <div className="metric-content">
            <span>Tempo médio de revisão</span>
            <strong>8h</strong>
            <small>Últimos 30 dias</small>
          </div>
        </article>

        <article className="metric-card elevation-1">
          <div className="metric-icon">
            <MessageSquareText size={19} />
          </div>

          <div className="metric-content">
            <span>Aprovações pendentes</span>
            <strong>4</strong>
            <small>Requerem revisão</small>
          </div>
        </article>
      </section>

      <section className="panel elevation-1">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">
              MONITORAMENTO DE ENTREGAS
            </span>

            <h2>Pull Requests</h2>

            <p>
              Solicitações de integração que exigem revisão, aprovação ou
              acompanhamento da gestão.
            </p>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>PULL REQUEST</th>
                <th>REPOSITÓRIO</th>
                <th>AUTOR</th>
                <th>REVISORES</th>
                <th>ABERTA HÁ</th>
                <th>STATUS</th>
              </tr>
            </thead>

            <tbody>
              {pullRequests.map((pullRequest) => (
                <tr key={pullRequest.id}>
                  <td>
                    <div className="service-name">
                      <span className="avatar">
                        <GitPullRequest size={15} />
                      </span>

                      <div>
                        <b>
                          {pullRequest.id} — {pullRequest.title}
                        </b>
                      </div>
                    </div>
                  </td>

                  <td className="mono">
                    {pullRequest.repository}
                  </td>

                  <td>{pullRequest.author}</td>

                  <td>
                    <span className="inline-icon-text">
                      <UserRound size={15} />
                      {pullRequest.reviewers}
                    </span>
                  </td>

                  <td>{pullRequest.age}</td>

                  <td>
                    <span
                      className={`status-badge ${pullRequest.variant}`}
                    >
                      {pullRequest.status}
                    </span>
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