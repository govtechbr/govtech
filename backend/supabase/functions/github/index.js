// Edge Function `github`: conectar, sincronizar e desconectar a chave de um projeto
// (docs/PLANO_TECNICO.md §18). Roda no Deno do Supabase.
//
// Duas conexões com o banco:
// - `asUser`: com o login de quem chamou; o RLS decide o que ele enxerga.
// - `asServer`: com a chave de serviço, que só existe aqui. Usada para o Vault
//   e para gravar os dados sincronizados, DEPOIS de conferir o papel do usuário.
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'

import {
  checkToken,
  fetchProjectData,
  GitHubError,
  toBranchRow,
  toPullRequestRow,
  toRepositoryRow,
} from './github.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Quem pode cada ação (decisão G2: admin e developer sincronizam)
const allowedRoles = {
  connect: ['admin'],
  disconnect: ['admin'],
  sync: ['admin', 'developer'],
}

class RequestError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function serverKey() {
  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS')

  return secretKeys ? JSON.parse(secretKeys).default : Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
}

function publishableKey() {
  const keys = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')

  return keys ? JSON.parse(keys).default : Deno.env.get('SUPABASE_ANON_KEY')
}

function check(error) {
  if (error) {
    console.error(error)
    throw new RequestError('Erro ao gravar no banco. Tente de novo.', 500)
  }
}

// Confere login, se o projeto existe para o usuário (RLS) e o papel dele na organização
async function authorize(request, projectId, action) {
  const url = Deno.env.get('SUPABASE_URL')
  const asUser = createClient(url, publishableKey(), {
    global: {
      headers: { Authorization: request.headers.get('Authorization') ?? '' },
    },
    auth: { persistSession: false },
  })

  const { data: userData } = await asUser.auth.getUser()
  const user = userData?.user
  if (!user) throw new RequestError('Faça login de novo.', 401)

  const { data: project } = await asUser
    .from('projects')
    .select('id, organization_id')
    .eq('id', projectId)
    .maybeSingle()
  if (!project) throw new RequestError('Projeto não encontrado.', 404)

  const { data: member } = await asUser
    .from('organization_members')
    .select('role')
    .eq('organization_id', project.organization_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member || !allowedRoles[action].includes(member.role)) {
    throw new RequestError('Seu papel não permite esta ação.', 403)
  }

  const asServer = createClient(url, serverKey(), {
    auth: { persistSession: false },
  })

  return { user, project, asServer }
}

async function connect({ user, project, asServer }, token) {
  if (typeof token !== 'string' || token.trim().length < 20) {
    throw new RequestError('Cole a chave completa do GitHub.', 400)
  }

  const cleanToken = token.trim()
  const { login, repositoryCount } = await checkToken(cleanToken)

  if (repositoryCount === 0) {
    throw new RequestError('A chave funciona, mas não libera nenhum repositório.', 400)
  }

  const { error } = await asServer.rpc('github_save_token', {
    p_project_id: project.id,
    p_token: cleanToken,
    p_github_login: login,
    p_user_id: user.id,
  })
  check(error)

  return { login, repositoryCount }
}

// Grava as linhas novas e apaga as que não vieram do GitHub desta vez
async function replaceRows(asServer, table, rows, scope, conflictKey, columns = 'id') {
  const [scopeColumn, scopeValue] = scope
  let data = []

  if (rows.length > 0) {
    const result = await asServer
      .from(table)
      .upsert(rows, { onConflict: conflictKey })
      .select(columns)
    check(result.error)
    data = result.data
  }

  const keep = data.map((row) => row.id)
  let stale = asServer.from(table).delete().eq(scopeColumn, scopeValue)
  if (keep.length > 0) stale = stale.not('id', 'in', `(${keep.join(',')})`)
  check((await stale).error)

  return data
}

async function sync({ project, asServer }) {
  const { data: token, error } = await asServer.rpc('github_read_token', {
    p_project_id: project.id,
  })
  check(error)
  if (!token) throw new RequestError('Este projeto ainda não tem chave do GitHub.', 400)

  const ids = {
    projectId: project.id,
    organizationId: project.organization_id,
  }
  const projectData = await fetchProjectData(token)

  const repositories = await replaceRows(
    asServer,
    'repositories',
    projectData.map(({ repo }) => toRepositoryRow(repo, ids)),
    ['project_id', project.id],
    'project_id,github_id',
    'id, github_id',
  )
  const repositoryIdByGithubId = new Map(repositories.map((row) => [row.github_id, row.id]))

  let pullRequestCount = 0
  let branchCount = 0

  for (const { repo, pulls, branches } of projectData) {
    const repoIds = {
      ...ids,
      repositoryId: repositoryIdByGithubId.get(repo.id),
    }
    const scope = ['repository_id', repoIds.repositoryId]

    await replaceRows(
      asServer,
      'pull_requests',
      pulls.map((pr) => toPullRequestRow(pr, repoIds)),
      scope,
      'repository_id,number',
    )
    await replaceRows(
      asServer,
      'branches',
      branches.map((branch) => toBranchRow(branch, repoIds)),
      scope,
      'repository_id,name',
    )

    pullRequestCount += pulls.length
    branchCount += branches.length
  }

  const syncedAt = new Date().toISOString()
  check(
    (
      await asServer
        .from('github_credentials')
        .update({ last_synced_at: syncedAt })
        .eq('project_id', project.id)
    ).error,
  )

  return {
    repositoryCount: repositories.length,
    pullRequestCount,
    branchCount,
    syncedAt,
  }
}

async function disconnect({ project, asServer }) {
  const { error } = await asServer.rpc('github_disconnect', {
    p_project_id: project.id,
  })
  check(error)

  return { disconnected: true }
}

const actions = { connect, sync, disconnect }

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Use POST.' }, 405)

  try {
    const { action, projectId, token } = await request.json()

    if (!actions[action] || typeof projectId !== 'string') {
      throw new RequestError('Pedido inválido.', 400)
    }

    const context = await authorize(request, projectId, action)
    return json(await actions[action](context, token))
  } catch (error) {
    if (error instanceof RequestError) return json({ error: error.message }, error.status)

    // Problema com a chave vira 400 (não 401, que o front leria como sessão expirada)
    if (error instanceof GitHubError) {
      return json({ error: error.message }, error.status >= 500 || !error.status ? 502 : 400)
    }

    console.error(error)
    return json({ error: 'Erro inesperado. Tente de novo.' }, 500)
  }
})
