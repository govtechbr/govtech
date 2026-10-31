import { useEffect, useRef, useState } from 'react'
import {
  ChevronRight,
  GitBranch,
  GitPullRequest,
  Search,
  Server,
  Target,
  X,
} from 'lucide-react'

import { branches, pullRequests, services } from '../../data/mockData'
import { formatProjectDate } from '../../utils/projectUtils'

export default function GlobalSearch({
  open,
  onClose,
  projects,
  onNavigate,
  setSelectedProject,
}) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      window.setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  if (!open) return null

  const search = query.toLowerCase().trim()

  const results =
    search.length === 0
      ? []
      : [
          ...projects
            .filter((project) =>
              `${project.name} ${project.description} ${project.owner}`
                .toLowerCase()
                .includes(search)
            )
            .slice(0, 4)
            .map((project) => ({
              type: 'Projeto',
              title: project.name,
              subtitle: `Deadline: ${formatProjectDate(project.deadline)}`,
              icon: Target,
              action: () => {
                setSelectedProject(project)
                onNavigate('Projetos')
                onClose()
              },
            })),

          ...services
            .filter((service) =>
              `${service.name} ${service.team} ${service.language}`
                .toLowerCase()
                .includes(search)
            )
            .slice(0, 4)
            .map((service) => ({
              type: 'Repositório',
              title: service.name,
              subtitle: `${service.team} · ${service.language}`,
              icon: Server,
              action: () => {
                onNavigate('Repositórios')
                onClose()
              },
            })),

          ...pullRequests
            .filter((pr) =>
              `${pr.id} ${pr.title} ${pr.author} ${pr.repository}`
                .toLowerCase()
                .includes(search)
            )
            .slice(0, 4)
            .map((pr) => ({
              type: 'Pull Request',
              title: `#${pr.id} · ${pr.title}`,
              subtitle: `${pr.repository} · ${pr.author}`,
              icon: GitPullRequest,
              action: () => {
                onNavigate('Repositórios')
                onClose()
              },
            })),

          ...branches
            .filter((branch) =>
              `${branch.name} ${branch.repository} ${branch.author}`
                .toLowerCase()
                .includes(search)
            )
            .slice(0, 4)
            .map((branch) => ({
              type: 'Branch',
              title: branch.name,
              subtitle: `${branch.repository} · ${branch.author}`,
              icon: GitBranch,
              action: () => {
                onNavigate('Repositórios')
                onClose()
              },
            })),
        ]

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        style={{
          position: 'fixed',
          zIndex: 100,
          inset: 0,
          border: 0,
          background: 'rgba(18, 12, 30, 0.35)',
        }}
      />

      <div
        className="elevation-4"
        style={{
          position: 'fixed',
          zIndex: 101,
          top: '90px',
          left: '50%',
          width: 'min(720px, calc(100vw - 32px))',
          maxHeight: '70vh',
          overflowY: 'auto',
          padding: '14px',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          transform: 'translateX(-50%)',
          background: 'var(--surface)',
        }}
      >
        <div className="input-wrap">
          <Search size={18} />

          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar projetos, repositórios, PRs e branches..."
          />

          <button
            type="button"
            className="input-action"
            onClick={onClose}
          >
            <X size={17} />
          </button>
        </div>

        {!search && (
          <p
            style={{
              margin: '20px 8px 8px',
              color: 'var(--muted)',
            }}
          >
            Digite para pesquisar em todo o ambiente GovTech MS.
          </p>
        )}

        {search && results.length === 0 && (
          <p
            style={{
              margin: '28px 8px 12px',
              color: 'var(--muted)',
              textAlign: 'center',
            }}
          >
            Nenhum resultado encontrado.
          </p>
        )}

        <div
          style={{
            display: 'grid',
            gap: '6px',
            marginTop: results.length > 0 ? '14px' : 0,
          }}
        >
          {results.map((result, index) => {
            const ResultIcon = result.icon

            return (
              <button
                key={`${result.type}-${result.title}-${index}`}
                type="button"
                onClick={result.action}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px',
                  border: 0,
                  borderRadius: '8px',
                  background: 'transparent',
                  color: 'inherit',
                  textAlign: 'left',
                }}
              >
                <span
                  style={{
                    display: 'grid',
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    placeItems: 'center',
                    background: 'var(--color-primary-50)',
                    color: 'var(--color-primary-600)',
                  }}
                >
                  <ResultIcon size={17} />
                </span>

                <span style={{ flex: 1 }}>
                  <small
                    style={{
                      display: 'block',
                      color: 'var(--color-primary-600)',
                      fontSize: '10px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {result.type}
                  </small>

                  <strong
                    style={{
                      display: 'block',
                      marginTop: '2px',
                      fontSize: '13px',
                    }}
                  >
                    {result.title}
                  </strong>

                  <small style={{ color: 'var(--muted)' }}>
                    {result.subtitle}
                  </small>
                </span>

                <ChevronRight size={16} />
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}