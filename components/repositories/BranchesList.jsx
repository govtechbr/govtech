import {
  GitBranch,
  GitCommitHorizontal,
  ShieldCheck,
} from 'lucide-react'

const branches = [
  {
    name: 'main',
    repository: 'govtech-api',
    author: 'Marina Costa',
    lastCommit: 'a8f42c1',
    updated: '12 min atrás',
    protection: 'Protegida',
    status: 'success',
  },
  {
    name: 'develop',
    repository: 'govtech-dashboard',
    author: 'Ana Silva',
    lastCommit: 'b21d4e9',
    updated: '28 min atrás',
    protection: 'Protegida',
    status: 'success',
  },
  {
    name: 'feature/audit-trail',
    repository: 'governance-engine',
    author: 'Carlos Melo',
    lastCommit: 'c91f7d2',
    updated: '3h atrás',
    protection: 'Em revisão',
    status: 'warning',
  },
  {
    name: 'release/2.4',
    repository: 'notification-service',
    author: 'João Santos',
    lastCommit: 'd65aa10',
    updated: '1 dia atrás',
    protection: 'Atenção',
    status: 'danger',
  },
]

export default function BranchesList() {
  return (
    <>
      <section className="metrics-grid">
        <article className="metric-card elevation-1">
          <div className="metric-icon">
            <GitBranch size={19} />
          </div>

          <div className="metric-content">
            <span>Branches ativas</span>
            <strong>31</strong>
            <small>Em todos os repositórios</small>
          </div>
        </article>

        <article className="metric-card elevation-1">
          <div className="metric-icon">
            <ShieldCheck size={19} />
          </div>

          <div className="metric-content">
            <span>Branches protegidas</span>
            <strong>14</strong>
            <small>Com regras de aprovação</small>
          </div>
        </article>

        <article className="metric-card elevation-1">
          <div className="metric-icon">
            <GitCommitHorizontal size={19} />
          </div>

          <div className="metric-content">
            <span>Commits no período</span>
            <strong>186</strong>
            <small>Últimos 7 dias</small>
          </div>
        </article>
      </section>

      <section className="panel elevation-1">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">
              FLUXO DE DESENVOLVIMENTO
            </span>

            <h2>Branches acompanhadas</h2>

            <p>
              Acompanhe branches ativas, proteção de fluxo e atualizações dos
              repositórios.
            </p>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>BRANCH</th>
                <th>REPOSITÓRIO</th>
                <th>RESPONSÁVEL</th>
                <th>ÚLTIMO COMMIT</th>
                <th>ATUALIZADA</th>
                <th>STATUS</th>
              </tr>
            </thead>

            <tbody>
              {branches.map((branch) => (
                <tr key={`${branch.repository}-${branch.name}`}>
                  <td>
                    <span className="inline-icon-text">
                      <GitBranch size={15} />
                      <strong>{branch.name}</strong>
                    </span>
                  </td>

                  <td>{branch.repository}</td>

                  <td>{branch.author}</td>

                  <td>
                    <span className="mono">
                      {branch.lastCommit}
                    </span>
                  </td>

                  <td>{branch.updated}</td>

                  <td>
                    <span className={`status-badge ${branch.status}`}>
                      {branch.protection}
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