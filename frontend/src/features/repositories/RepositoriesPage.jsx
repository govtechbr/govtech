import { useState } from 'react'
import { Folder, GitBranch, GitPullRequest } from 'lucide-react'

import BranchesList from '@/features/repositories/components/BranchesList'
import PullRequestsList from '@/features/repositories/components/PullRequestsList'
import RepositoriesList from '@/features/repositories/components/RepositoriesList'
import { useRepositoryData } from '@/features/repositories/hooks/useRepositoryData'
import styles from '@/features/repositories/RepositoriesPage.module.css'
import Select from '@/shared/ui/Select'

const tabs = [
  { id: 'repositorios', label: 'Repositórios', icon: Folder },
  { id: 'pull-requests', label: 'Pull Requests', icon: GitPullRequest },
  { id: 'branches', label: 'Branches', icon: GitBranch },
]

// projects: projetos da organização (vêm do adaptador em app/routes.jsx), para o filtro
export default function RepositoriesPage({ projects = [] }) {
  const [tab, setTab] = useState('repositorios')
  const [projectId, setProjectId] = useState('')
  const data = useRepositoryData(projectId)

  const projectNames = Object.fromEntries(projects.map((project) => [project.id, project.name]))
  const projectOptions = [
    { value: '', label: 'Todos os projetos' },
    ...projects.map((project) => ({ value: project.id, label: project.name })),
  ]

  return (
    <main className="dashboard-content">
      <div className="dashboard-intro">
        <div>
          <span className="eyebrow">MONITORAMENTO DE DESENVOLVIMENTO</span>
          <p>Repositórios, Pull Requests e branches sincronizados do GitHub.</p>
        </div>

        <Select
          className={styles.filter}
          label="Projeto"
          options={projectOptions}
          value={projectId}
          onChange={setProjectId}
        />
      </div>

      <section className={`panel elevation-1 ${styles.tabsPanel}`}>
        <div className={`section-tabs ${styles.tabs}`}>
          <div>
            {tabs.map((item) => {
              const TabIcon = item.icon

              return (
                <button
                  key={item.id}
                  type="button"
                  className={tab === item.id ? 'active' : ''}
                  aria-pressed={tab === item.id}
                  onClick={() => setTab(item.id)}
                >
                  <TabIcon size={16} />
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {data.isPending && (
        <p role="status" className={styles.state}>
          Carregando dados do GitHub…
        </p>
      )}

      {data.isError && (
        <p role="alert" className={styles.state}>
          {data.error.message}
        </p>
      )}

      {data.isSuccess && data.data.repositories.length === 0 && (
        <section className={`panel elevation-1 ${styles.empty}`}>
          <h2>Nenhum repositório sincronizado</h2>
          <p>
            Para trazer os dados, o admin abre um projeto em <strong>Projetos</strong>, conecta a
            chave do GitHub na seção GitHub e clica em <strong>Sincronizar</strong>.
          </p>
        </section>
      )}

      {data.isSuccess && data.data.repositories.length > 0 && (
        <>
          {tab === 'repositorios' && (
            <RepositoriesList
              repositories={data.data.repositories}
              pullRequests={data.data.pullRequests}
              branches={data.data.branches}
              projectNames={projectNames}
            />
          )}

          {tab === 'pull-requests' && <PullRequestsList pullRequests={data.data.pullRequests} />}

          {tab === 'branches' && <BranchesList branches={data.data.branches} />}
        </>
      )}
    </main>
  )
}
