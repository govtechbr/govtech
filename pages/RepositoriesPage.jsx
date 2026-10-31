import { useState } from 'react'
import {
  Folder,
  GitBranch,
  GitPullRequest,
} from 'lucide-react'

import BranchesList from '../components/repositories/BranchesList'
import PullRequestsList from '../components/repositories/PullRequestsList'
import RepositoriesList from '../components/repositories/RepositoriesList'

export default function RepositoriesPage() {
  const [tab, setTab] = useState('repositorios')

  const tabs = [
    {
      id: 'repositorios',
      label: 'Repositórios',
      icon: Folder,
    },
    {
      id: 'pull-requests',
      label: 'Pull Requests',
      icon: GitPullRequest,
    },
    {
      id: 'branches',
      label: 'Branches',
      icon: GitBranch,
    },
  ]

  return (
    <main className="dashboard-content">
      <div className="dashboard-intro">
        <div>
          <span className="eyebrow">
            MONITORAMENTO DE DESENVOLVIMENTO
          </span>
          <p>
            Acompanhe repositórios, Pull Requests e branches para apoiar a
            governança dos projetos.
          </p>
        </div>
      </div>

      <section
        className="panel elevation-1"
        style={{ marginBottom: '24px' }}
      >
        <div
          className="section-tabs"
          style={{
            padding: '0 16px',
            borderBottom: 'none',
          }}
        >
          <div>
            {tabs.map((item) => {
              const TabIcon = item.icon

              return (
                <button
                  key={item.id}
                  type="button"
                  className={tab === item.id ? 'active' : ''}
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

      {tab === 'repositorios' && <RepositoriesList />}

      {tab === 'pull-requests' && <PullRequestsList />}

      {tab === 'branches' && <BranchesList />}
    </main>
  )
}