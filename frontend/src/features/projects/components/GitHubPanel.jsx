import { useState } from 'react'
import { ExternalLink, KeyRound, ListChecks, RefreshCw, Unplug } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import styles from '@/features/projects/components/GitHubPanel.module.css'
import RepositoryPicker from '@/features/projects/components/RepositoryPicker'
import {
  useConnectGitHub,
  useDisconnectGitHub,
  useGitHubConnection,
  useSyncGitHub,
} from '@/features/projects/hooks/useGitHub'
import { timeAgo } from '@/shared/lib/date'
import { zodResolver } from '@/shared/lib/zodResolver'
import { useToast } from '@/shared/hooks/useToast'

const tokenSchema = z.object({
  token: z.string().trim().min(20, 'Cole a chave completa do GitHub.'),
})

const newTokenUrl = 'https://github.com/settings/personal-access-tokens/new'

function TokenForm({ projectId, onDone, onCancel }) {
  const { showToast } = useToast()
  const connect = useConnectGitHub()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(tokenSchema), defaultValues: { token: '' } })

  async function onSubmit({ token }) {
    try {
      const { login, repositoryCount } = await connect.mutateAsync({ projectId, token })

      // A chave não fica no navegador depois de enviada
      reset()
      showToast(`GitHub conectado como ${login} (${repositoryCount} repositório(s)).`)
      onDone()
    } catch (error) {
      setError('token', { message: error.message })
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <label htmlFor="github-token">Chave do GitHub (fine-grained, só leitura)</label>

      <input
        id="github-token"
        type="password"
        autoComplete="off"
        spellCheck={false}
        className={styles.input}
        aria-invalid={Boolean(errors.token)}
        aria-describedby={errors.token ? 'github-token-error' : 'github-token-help'}
        {...register('token')}
      />

      {errors.token && (
        <p id="github-token-error" className={styles.error}>
          {errors.token.message}
        </p>
      )}

      <details id="github-token-help" className={styles.help}>
        <summary>Como criar a chave</summary>
        <ol>
          <li>
            No GitHub, abra{' '}
            <a href={newTokenUrl} target="_blank" rel="noreferrer">
              Fine-grained tokens <ExternalLink size={12} aria-hidden="true" />
            </a>
            .
          </li>
          <li>Em Repository access, escolha só os repositórios deste projeto.</li>
          <li>
            Em Permissions, marque Contents, Pull requests, Commit statuses e Actions como
            Read-only. As duas últimas trazem o status do CI.
          </li>
          <li>Gere a chave e cole aqui. Ela fica guardada criptografada e não aparece de novo.</li>
        </ol>
      </details>

      <div className={styles.actions}>
        <button type="submit" className="primary-button small" disabled={isSubmitting}>
          <KeyRound size={14} />
          {isSubmitting ? 'Testando a chave…' : 'Conectar'}
        </button>

        {onCancel && (
          <button type="button" className="secondary-button small" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}

// canManage: admin (conecta, escolhe repositórios, troca e remove). canSync: admin e developer.
export default function GitHubPanel({ projectId, canManage, canSync }) {
  const { showToast } = useToast()
  const connection = useGitHubConnection(projectId)
  const sync = useSyncGitHub()
  const disconnect = useDisconnectGitHub()
  const [editing, setEditing] = useState(false)
  const [picking, setPicking] = useState(false)
  const [confirmingRemoval, setConfirmingRemoval] = useState(false)

  async function runSync() {
    try {
      const result = await sync.mutateAsync(projectId)
      showToast(
        `Sincronizado: ${result.repositoryCount} repositório(s), ${result.pullRequestCount} PR(s), ${result.branchCount} branch(es) e ${result.commitCount} commit(s).`,
      )
    } catch (error) {
      showToast(error.message, 'danger')
    }
  }

  async function runDisconnect() {
    setConfirmingRemoval(false)

    try {
      await disconnect.mutateAsync(projectId)
      showToast('Conexão com o GitHub removida.', 'warning')
    } catch (error) {
      showToast(error.message, 'danger')
    }
  }

  if (connection.isPending) {
    return <p className={styles.muted}>Carregando conexão com o GitHub…</p>
  }

  if (connection.isError) {
    return (
      <p role="alert" className={styles.error}>
        {connection.error.message}
      </p>
    )
  }

  const github = connection.data

  if (!github || editing) {
    return (
      <div>
        {!github && <p className={styles.muted}>Nenhuma chave do GitHub conectada.</p>}

        {canManage ? (
          <TokenForm
            projectId={projectId}
            onDone={() => {
              setEditing(false)
              // Logo depois de conectar, o admin escolhe os repositórios do projeto
              setPicking(true)
            }}
            onCancel={editing ? () => setEditing(false) : null}
          />
        ) : (
          <p className={styles.muted}>Peça ao admin da organização para conectar o GitHub.</p>
        )}
      </div>
    )
  }

  return (
    <div>
      <p className={styles.status}>
        Conectado como <strong>{github.login}</strong> · chave ••••{github.last4}
        <span className={styles.muted}>
          {' '}
          ·{' '}
          {github.lastSyncedAt
            ? `sincronizado ${timeAgo(github.lastSyncedAt)}`
            : 'ainda não sincronizado'}{' '}
          · atualiza sozinho a cada hora
        </span>
      </p>

      {github.lastSyncError && (
        <p role="alert" className={styles.error}>
          A última sincronização automática falhou: {github.lastSyncError}
        </p>
      )}

      {github.lastSyncPartial && (
        <p className={styles.muted}>
          Dados parciais: algum repositório tem mais itens do que o limite da sincronização (PRs
          abertos e dos últimos 90 dias até 1.000, branches até 500, commits até 1.000).
        </p>
      )}

      {picking && canManage && (
        <RepositoryPicker
          projectId={projectId}
          onDone={() => setPicking(false)}
          onCancel={() => setPicking(false)}
        />
      )}

      {!picking && github.repositories.length === 0 && (
        <p className={styles.muted}>
          {canManage
            ? 'Escolha quais repositórios fazem parte deste projeto.'
            : 'O admin ainda não escolheu os repositórios deste projeto.'}
        </p>
      )}

      {!picking && github.repositories.length > 0 && (
        <ul className={styles.repoList}>
          {github.repositories.map((repository) => (
            <li key={repository.id}>
              <a href={repository.html_url} target="_blank" rel="noreferrer">
                {repository.full_name}
              </a>
            </li>
          ))}
        </ul>
      )}

      {picking ? null : confirmingRemoval ? (
        <div className={styles.confirm} role="group" aria-label="Confirmar remoção">
          <p>Remover a conexão apaga a chave e os dados sincronizados deste projeto.</p>
          <div className={styles.actions}>
            <button
              type="button"
              className={`primary-button small ${styles.danger}`}
              onClick={runDisconnect}
            >
              Remover conexão
            </button>
            <button
              type="button"
              className="secondary-button small"
              onClick={() => setConfirmingRemoval(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.actions}>
          {canSync && github.repositories.length > 0 && (
            <button
              type="button"
              className="primary-button small"
              onClick={runSync}
              disabled={sync.isPending}
            >
              <RefreshCw size={14} />
              {sync.isPending ? 'Sincronizando…' : 'Sincronizar'}
            </button>
          )}

          {canManage && (
            <>
              <button
                type="button"
                className={
                  github.repositories.length === 0
                    ? 'primary-button small'
                    : 'secondary-button small'
                }
                onClick={() => setPicking(true)}
              >
                <ListChecks size={14} />
                Escolher repositórios
              </button>
              <button
                type="button"
                className="secondary-button small"
                onClick={() => setEditing(true)}
              >
                <KeyRound size={14} />
                Trocar chave
              </button>
              <button
                type="button"
                className="secondary-button small"
                onClick={() => setConfirmingRemoval(true)}
              >
                <Unplug size={14} />
                Remover
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
