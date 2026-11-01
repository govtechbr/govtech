// Edge Function `github`: conectar, sincronizar e desconectar a chave de um projeto
// (docs/PLANO_TECNICO.md §18). Roda no Deno do Supabase.
//
// verify_jwt desligado: o agendador (pg_cron) chama sem login, com a senha do
// Vault no cabeçalho `x-cron-secret`. Todas as outras ações conferem o login aqui.
//
// Duas conexões com o banco:
// - `asUser`: com o login de quem chamou; o RLS decide o que ele enxerga.
// - `asServer`: com a chave de serviço, que só existe aqui. Usada para o Vault
//   e para gravar os dados sincronizados, DEPOIS de conferir o papel do usuário.
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'

import {
  checkToken,
  fetchRepositoryData,
  GitHubError,
  listRepositories,
  toAvailableRepository,
  toBranchRow,
  toCommitRow,
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
  list: ['admin'],
  select: ['admin'],
  disconnect: ['admin'],
  sync: ['admin', 'developer'],
}

// Commits guardados: os do maior período do seletor da Visão geral
const COMMIT_DAYS = 90

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

function serverClient() {
  return createClient(Deno.env.get('SUPABASE_URL'), serverKey(), {
    auth: { persistSession: false },
  })
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

  return { user, project, asServer: serverClient() }
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

async function readToken(asServer, projectId) {
  const { data: token, error } = await asServer.rpc('github_read_token', {
    p_project_id: projectId,
  })
  check(error)
  if (!token) throw new RequestError('Este projeto ainda não tem chave do GitHub.', 400)

  return token
}

// Repositórios ligados ao projeto (a seleção do admin)
async function linkedRepositories(asServer, projectId) {
  const { data, error } = await asServer
    .from('project_repositories')
    .select('repository:repositories (id, github_id)')
    .eq('project_id', projectId)
  check(error)

  return data.map((row) => row.repository)
}

// Lista o que a chave enxerga, marcando o que já está no projeto
async function list({ project, asServer }) {
  const token = await readToken(asServer, project.id)
  const [repos, linked] = await Promise.all([
    listRepositories(token),
    linkedRepositories(asServer, project.id),
  ])
  const selectedIds = new Set(linked.map((repository) => repository.github_id))

  return { repositories: repos.map((repo) => toAvailableRepository(repo, selectedIds)) }
}

// Salva a seleção do admin e já sincroniza. Só aceita repositórios que a chave enxerga.
async function select(context, _token, body) {
  const { project, asServer } = context
  const githubIds = body.githubIds

  if (!Array.isArray(githubIds) || githubIds.length === 0) {
    throw new RequestError('Escolha ao menos um repositório.', 400)
  }

  const token = await readToken(asServer, project.id)
  const visible = await listRepositories(token)
  const chosen = visible.filter((repo) => githubIds.includes(repo.id))

  if (chosen.length !== new Set(githubIds).size) {
    throw new RequestError('Algum repositório escolhido não está mais disponível nesta chave.', 400)
  }

  const ids = { organizationId: project.organization_id }
  const { data: repositories, error } = await asServer
    .from('repositories')
    .upsert(
      chosen.map((repo) => toRepositoryRow(repo, ids)),
      { onConflict: 'organization_id,github_id' },
    )
    .select('id')
  check(error)

  const keep = repositories.map((row) => row.id)
  check(
    (
      await asServer.from('project_repositories').upsert(
        keep.map((repositoryId) => ({
          project_id: project.id,
          repository_id: repositoryId,
          organization_id: project.organization_id,
        })),
        { onConflict: 'project_id,repository_id', ignoreDuplicates: true },
      )
    ).error,
  )

  // Desmarcados saem do projeto; o banco apaga o repositório se nenhum projeto o usa (G5)
  check(
    (
      await asServer
        .from('project_repositories')
        .delete()
        .eq('project_id', project.id)
        .not('repository_id', 'in', `(${keep.join(',')})`)
    ).error,
  )

  return sync(context)
}

async function sync({ project, asServer }) {
  const token = await readToken(asServer, project.id)
  const linked = await linkedRepositories(asServer, project.id)

  if (linked.length === 0) {
    throw new RequestError('Escolha os repositórios do projeto antes de sincronizar.', 400)
  }

  // Dados atuais dos repositórios escolhidos que a chave ainda enxerga
  const linkedIds = new Map(linked.map((repository) => [repository.github_id, repository.id]))
  const visible = (await listRepositories(token)).filter((repo) => linkedIds.has(repo.id))
  const ids = { organizationId: project.organization_id }

  if (visible.length > 0) {
    check(
      (
        await asServer.from('repositories').upsert(
          visible.map((repo) => toRepositoryRow(repo, ids)),
          { onConflict: 'organization_id,github_id' },
        )
      ).error,
    )
  }

  let pullRequestCount = 0
  let branchCount = 0

  let commitCount = 0
  const since = new Date(Date.now() - COMMIT_DAYS * 24 * 60 * 60 * 1000).toISOString()

  for (const { repo, pulls, branches, commits } of await fetchRepositoryData(
    token,
    visible,
    fetch,
    since,
  )) {
    const repoIds = { ...ids, repositoryId: linkedIds.get(repo.id) }
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
    // os que passaram de 90 dias saem por não virem mais do GitHub
    await replaceRows(
      asServer,
      'commits',
      commits.map((commit) => toCommitRow(commit, repoIds)),
      scope,
      'repository_id,sha',
    )

    pullRequestCount += pulls.length
    branchCount += branches.length
    commitCount += commits.length
  }

  const syncedAt = new Date().toISOString()
  check(
    (
      await asServer
        .from('github_credentials')
        .update({ last_synced_at: syncedAt, last_sync_error: null })
        .eq('project_id', project.id)
    ).error,
  )

  return {
    repositoryCount: visible.length,
    // escolhidos que a chave deixou de enxergar (ex.: permissão retirada no GitHub)
    unavailableCount: linked.length - visible.length,
    pullRequestCount,
    branchCount,
    commitCount,
    syncedAt,
  }
}

function errorMessage(error) {
  if (error instanceof RequestError || error instanceof GitHubError) return error.message

  console.error(error)
  return 'Erro inesperado. Tente de novo.'
}

// Agendador (regra G6): sincroniza um projeto por vez; a falha de um (ex.: chave
// expirada) fica registrada na conexão e não para os outros
async function syncAll(asServer) {
  const { data, error } = await asServer
    .from('github_credentials')
    .select('project_id, organization_id')
  check(error)

  for (const row of data) {
    const project = { id: row.project_id, organization_id: row.organization_id }

    try {
      await sync({ project, asServer })
    } catch (syncError) {
      await asServer
        .from('github_credentials')
        .update({ last_sync_error: errorMessage(syncError) })
        .eq('project_id', project.id)
    }
  }
}

// Comparação em tempo constante, para não vazar a senha pelo tempo de resposta
function sameSecret(given, expected) {
  if (!given || !expected || given.length !== expected.length) return false

  let difference = 0
  for (let index = 0; index < given.length; index += 1) {
    difference |= given.charCodeAt(index) ^ expected.charCodeAt(index)
  }
  return difference === 0
}

async function startSyncAll(request) {
  const asServer = serverClient()
  const { data: secret, error } = await asServer.rpc('github_cron_secret')
  check(error)

  if (!sameSecret(request.headers.get('x-cron-secret'), secret)) {
    throw new RequestError('Não autorizado.', 401)
  }

  // Responde logo; a sincronização continua depois da resposta
  EdgeRuntime.waitUntil(syncAll(asServer))
  return json({ started: true }, 202)
}

async function disconnect({ project, asServer }) {
  const { error } = await asServer.rpc('github_disconnect', {
    p_project_id: project.id,
  })
  check(error)

  return { disconnected: true }
}

const actions = { connect, list, select, sync, disconnect }

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Use POST.' }, 405)

  try {
    const body = await request.json()
    const { action, projectId, token } = body

    if (action === 'sync-all') return await startSyncAll(request)

    if (!actions[action] || typeof projectId !== 'string') {
      throw new RequestError('Pedido inválido.', 400)
    }

    const context = await authorize(request, projectId, action)
    return json(await actions[action](context, token, body))
  } catch (error) {
    if (error instanceof RequestError) return json({ error: error.message }, error.status)

    // Problema com a chave vira 400 (não 401, que o front leria como sessão expirada)
    if (error instanceof GitHubError) {
      return json({ error: error.message }, error.status >= 500 || !error.status ? 502 : 400)
    }

    return json({ error: errorMessage(error) }, 500)
  }
})
