import { useState } from 'react'
import { Check } from 'lucide-react'

import styles from '@/features/projects/components/GitHubPanel.module.css'
import {
  useAvailableRepositories,
  useSelectRepositories,
} from '@/features/projects/hooks/useGitHub'
import { useToast } from '@/shared/hooks/useToast'

// O admin marca quais dos repositórios que a chave enxerga são deste projeto (regra G2)
export default function RepositoryPicker({ projectId, onDone, onCancel }) {
  const { showToast } = useToast()
  const available = useAvailableRepositories(projectId, true)
  const select = useSelectRepositories()
  // null = ainda não mexeu: vale o que já estava selecionado no banco
  const [checked, setChecked] = useState(null)
  const [error, setError] = useState(null)

  if (available.isPending) {
    return <p className={styles.muted}>Buscando os repositórios no GitHub…</p>
  }

  if (available.isError) {
    return (
      <p role="alert" className={styles.error}>
        {available.error.message}
      </p>
    )
  }

  const repositories = available.data
  const selected =
    checked ?? new Set(repositories.filter((repo) => repo.selected).map((repo) => repo.githubId))

  function toggle(githubId) {
    const next = new Set(selected)

    if (next.has(githubId)) {
      next.delete(githubId)
    } else {
      next.add(githubId)
    }

    setChecked(next)
    setError(null)
  }

  async function save(event) {
    event.preventDefault()

    if (selected.size === 0) {
      setError('Marque ao menos um repositório.')
      return
    }

    try {
      const result = await select.mutateAsync({ projectId, githubIds: [...selected] })
      showToast(
        `Repositórios salvos e sincronizados: ${result.repositoryCount} repositório(s), ${result.pullRequestCount} PR(s).`,
      )
      onDone()
    } catch (saveError) {
      setError(saveError.message)
    }
  }

  return (
    <form className={styles.form} onSubmit={save} noValidate>
      <fieldset className={styles.picker} aria-describedby="repository-picker-help">
        <legend>Repositórios deste projeto</legend>

        <p id="repository-picker-help" className={styles.muted}>
          A chave do GitHub também lê todos os repositórios públicos. Marque só os que fazem parte
          deste projeto.
        </p>

        <ul className={styles.pickerList}>
          {repositories.map((repo) => (
            <li key={repo.githubId}>
              <label>
                <input
                  type="checkbox"
                  checked={selected.has(repo.githubId)}
                  onChange={() => toggle(repo.githubId)}
                />
                <strong>{repo.fullName}</strong>
                <small>
                  {repo.private ? 'Privado' : 'Público'}
                  {repo.description ? ` · ${repo.description}` : ''}
                </small>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      <div className={styles.actions}>
        <button type="submit" className="primary-button small" disabled={select.isPending}>
          <Check size={14} />
          {select.isPending ? 'Salvando e sincronizando…' : `Salvar (${selected.size})`}
        </button>

        <button type="button" className="secondary-button small" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
