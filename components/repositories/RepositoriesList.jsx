import {
  GitBranch,
  GitPullRequest,
  MoreHorizontal,
  ShieldCheck,
} from 'lucide-react'

const repositories = [
  {
    name: 'govtech-api',
    language: 'Node.js',
    branch: 'main',
    pullRequests: 4,
    pipeline: 'Aprovada',
    status: 'success',
  },
  {
    name: 'govtech-dashboard',
    language: 'React',
    branch: 'develop',
    pullRequests: 3,
    pipeline: 'Em análise',
    status: 'warning',
  },
  {
    name: 'governance-engine',
    language: 'Python',
    branch: 'main',
    pullRequests: 1,
    pipeline: 'Aprovada',
    status: 'success',
  },
  {
    name: 'notification-service',
    language: 'Java',
    branch: 'release',
    pullRequests: 2,
    pipeline: 'Atenção',
    status: 'danger',
  },
]

export default function RepositoriesList() {
  return (
    <>
      <section className="metrics-grid">
        <article className="metric-card elevation-1">
          <div className="metric-icon">
            <GitBranch size={19} />
          </div>

          <div className="metric-content">
            <span>Repositórios ativos</span>
            <strong>12</strong>
            <small>Projetos monitorados</small>
          </div>
        </article>

        <article className="metric-card elevation-1">
          <div className="metric-icon">
            <GitBranch size={19} />
          </div>

          <div className="metric-content">
            <span>Branches acompanhadas</span>
            <strong>31</strong>
            <small>Ativas no período</small>
          </div>
        </article>

        <article className="metric-card elevation-1">
          <div className="metric-icon">
            <GitPullRequest size={19} />
          </div>

          <div className="metric-content">
            <span>Pull Requests abertas</span>
            <strong>10</strong>
            <small>Demandam revisão</small>
          </div>
        </article>
      </section>

      <section className="panel elevation-1">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">
              VISÃO CONSOLIDADA
            </span>

            <h2>Repositórios monitorados</h2>

            <p>Atividade consolidada dos repositórios sincronizados.</p>
          </div>

          <button type="button" className="primary-button small">
            <GitBranch size={15} />
            Conectar repositório
          </button>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>REPOSITÓRIO</th>
                <th>STACK</th>
                <th>BRANCH PRINCIPAL</th>
                <th>PULL REQUESTS</th>
                <th>PIPELINE</th>
                <th aria-label="Ações" />
              </tr>
            </thead>

            <tbody>
              {repositories.map((repository) => (
                <tr key={repository.name}>
                  <td>
                    <div className="service-name">
                      <span className="avatar">
                        {repository.name
                          .split('-')
                          .map((part) => part[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>

                      <div>
                        <b>{repository.name}</b>
                        <small>Sincronizado com GitHub</small>
                      </div>
                    </div>
                  </td>

                  <td>{repository.language}</td>

                  <td>
                    <span className="mono">
                      {repository.branch}
                    </span>
                  </td>

                  <td>
                    <span className="inline-icon-text">
                      <GitPullRequest size={15} />
                      {repository.pullRequests}
                    </span>
                  </td>

                  <td>
                    <span className={`status-badge ${repository.status}`}>
                      <ShieldCheck size={13} />
                      {repository.pipeline}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Ações de ${repository.name}`}
                    >
                      <MoreHorizontal size={17} />
                    </button>
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