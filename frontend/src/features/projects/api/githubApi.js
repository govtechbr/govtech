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

export function disconnectGitHub(projectId) {
  return callGitHub({ action: 'disconnect', projectId })
}

// null quando o projeto ainda não tem chave
export async function getGitHubConnection(projectId) {
  const [connection, repositories] = await Promise.all([
    supabase
      .from('github_credentials')
      .select('token_last4, github_login, last_synced_at')
      .eq('project_id', projectId)
      .maybeSingle(),
    supabase
      .from('repositories')
      .select('id, full_name, html_url')
      .eq('project_id', projectId)
      .order('full_name'),
  ])

  if (connection.error || repositories.error) {
    throw new Error('Não foi possível carregar a conexão com o GitHub.')
  }

  if (!connection.data) return null

  return {
    last4: connection.data.token_last4,
    login: connection.data.github_login,
    lastSyncedAt: connection.data.last_synced_at,
    repositories: repositories.data,
  }
}
