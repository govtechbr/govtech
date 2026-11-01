import { Folder, GitBranch, GitPullRequest, Lock } from 'lucide-react'

import styles from '@/features/repositories/RepositoriesPage.module.css'
import { timeAgo } from '@/shared/lib/date'
import MetricCard from '@/features/repositories/components/MetricCard'

export default function RepositoriesList({ repositories, pullRequests, branches, projectNames }) {
  const openByRepository = {}

  for (const pr of pullRequests) {
    if (pr.state === 'open') {
      openByRepository[pr.repository_id] = (openByRepository[pr.repository_id] ?? 0) + 1
    }
  }

  return (
    <>
      <section className="metrics-grid">
        <MetricCard
          icon={Folder}
          label="Repositórios"
          value={repositories.length}
          hint="Sincronizados"
        />
        <MetricCard
          icon={GitPullRequest}
          label="PRs abertos"
          value={pullRequests.filter((pr) => pr.state === 'open').length}
          hint="Em todos os repositórios"
        />
        <MetricCard
          icon={GitBranch}
          label="Branches"
          value={branches.length}
          hint="Ativas no GitHub"
        />
      </section>

      <section className="panel elevation-1">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">GITHUB</span>
            <h2>Repositórios</h2>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>REPOSITÓRIO</th>
                <th>PROJETO</th>
                <th>LINGUAGEM</th>
                <th>PRS ABERTOS</th>
                <th>ÚLTIMO PUSH</th>
              </tr>
            </thead>

            <tbody>
              {repositories.map((repository) => (
                <tr key={repository.id}>
                  <td>
                    <div className="service-name">
                      <span className="avatar">
                        {repository.private ? <Lock size={15} /> : <Folder size={15} />}
                      </span>

                      <div>
                        <a
                          className={styles.link}
                          href={repository.html_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {repository.full_name}
                        </a>
                        {repository.description && (
                          <small className={styles.sub}>{repository.description}</small>
                        )}
                      </div>
                    </div>
                  </td>

                  <td>{projectNames[repository.project_id] ?? '—'}</td>
                  <td>{repository.language ?? '—'}</td>
                  <td>{openByRepository[repository.id] ?? 0}</td>
                  <td className="muted-cell">{timeAgo(repository.pushed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
