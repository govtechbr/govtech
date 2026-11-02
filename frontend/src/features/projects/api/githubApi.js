import { FunctionsHttpError } from '@supabase/supabase-js'

import { supabase } from '@/shared/lib/supabase'

// Conexão de um projeto com o GitHub. Conectar, sincronizar e desconectar passam
// pela Edge Function `github` (a chave nunca volta para o navegador); a situação
// da conexão e a lista de repositórios são lidas do banco (RLS).

async function callGitHub(body) {
  const { data, error } = await supabase.functions.invoke('github', { body })

  if (error instanceof FunctionsHttpError) {
    const payload = await error.context.json().catch(() => null)
    throw new Error(payload?.error ?? 'Não foi possível falar com o GitHub. Tente de novo.')
  }

  if (error) throw new Error('Não foi possível falar com o servidor. Tente de novo.')
  return data
}

export function connectGitHub({ projectId, token }) {
  return callGitHub({ action: 'connect', projectId, token })
}

export function syncGitHub(projectId) {
  return callGitHub({ action: 'sync', projectId })
}

// O que a chave enxerga, com os repositórios já escolhidos marcados (só admin)
export async function listAvailableRepositories(projectId) {
  const { repositories } = await callGitHub({ action: 'list', projectId })

  return repositories
}

// Salva a seleção e já sincroniza; devolve o resumo da sincronização
export function selectRepositories({ projectId, githubIds }) {
  return callGitHub({ action: 'select', projectId, githubIds })
}

export function disconnectGitHub(projectId) {
  return callGitHub({ action: 'disconnect', projectId })
}

// null quando o projeto ainda não tem chave
export async function getGitHubConnection(projectId) {
  const [connection, repositories] = await Promise.all([
    supabase
      .from('github_credentials')
      .select('token_last4, github_login, last_synced_at, last_sync_error, last_sync_partial')
      .eq('project_id', projectId)
      .maybeSingle(),
    supabase
      .from('project_repositories')
      .select('repository:repositories (id, full_name, html_url)')
      .eq('project_id', projectId),
  ])

  if (connection.error || repositories.error) {
    throw new Error('Não foi possível carregar a conexão com o GitHub.')
  }

  if (!connection.data) return null

  return {
    last4: connection.data.token_last4,
    login: connection.data.github_login,
    lastSyncedAt: connection.data.last_synced_at,
    // por que a sincronização automática (a cada hora) falhou; some na próxima que der certo
    lastSyncError: connection.data.last_sync_error,
    // a última sincronização bateu algum teto da paginação (regra G9)
    lastSyncPartial: Boolean(connection.data.last_sync_partial),
    repositories: repositories.data
      .map((row) => row.repository)
      .sort((a, b) => a.full_name.localeCompare(b.full_name)),
  }
}
