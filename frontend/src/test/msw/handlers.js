import { http, HttpResponse } from 'msw/http'

import {
  db,
  otherOrganization,
  sessionFor,
  testPassword,
  validGitHubToken,
  githubAvailable,
} from '@/test/msw/db'

// Imita as respostas do Supabase (PostgREST e Auth) só no que o app usa.

const url = import.meta.env.VITE_SUPABASE_URL
const rest = (path) => `${url}/rest/v1/${path}`

// .single() e .maybeSingle() pedem um objeto; sem eles, o PostgREST devolve lista
function rows(request, list, status = 200) {
  if (!request.headers.get('accept')?.includes('vnd.pgrst.object')) {
    return HttpResponse.json(list, { status })
  }

  if (list.length !== 1) {
    return HttpResponse.json(
      { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' },
      { status: 406 },
    )
  }

  return HttpResponse.json(list[0], { status })
}

// Filtro do tipo ?id=eq.<valor>
function eqParam(request, name) {
  return new URL(request.url).searchParams.get(name)?.replace(/^eq\./, '')
}

// Quem fez a chamada: o token simulado é "token-<id do usuário>" (ver sessionFor)
function callerId(request) {
  return request.headers.get('authorization')?.replace('Bearer token-', '')
}

function memberOf(organizationId, userId) {
  return db.members.find(
    (member) => member.organization_id === organizationId && member.user_id === userId,
  )
}

// Igual ao trigger keep_one_admin do banco
function leavesWithoutAdmin(member) {
  return (
    member.role === 'admin' &&
    !db.members.some(
      (other) =>
        other.organization_id === member.organization_id &&
        other.role === 'admin' &&
        other.user_id !== member.user_id,
    )
  )
}

const lastAdminError = () =>
  HttpResponse.json(
    { code: 'P0001', message: 'A organização precisa de pelo menos um administrador.' },
    { status: 400 },
  )

function authError(status, errorCode, msg) {
  return HttpResponse.json({ code: status, error_code: errorCode, msg }, { status })
}

function linksOf(repositoryId) {
  return db.projectRepositories
    .filter((link) => link.repository_id === repositoryId)
    .map((link) => ({ project_id: link.project_id }))
}

// Embute o repositório (com os projetos ligados) e aplica o filtro
// ?repository.project_repositories.project_id=eq.<valor>
function withRepository(request, rowsList) {
  const projectId = eqParam(request, 'repository.project_repositories.project_id')

  return rowsList
    .map((row) => {
      const repository = db.repositories.find(({ id }) => id === row.repository_id)

      return {
        ...row,
        repository: {
          name: repository.name,
          default_branch: repository.default_branch,
          project_repositories: linksOf(repository.id),
        },
      }
    })
    .filter(
      (row) =>
        !projectId ||
        row.repository.project_repositories.some((link) => link.project_id === projectId),
    )
}

// Filtro ?organization_id=eq.<valor> (a tela pede só a empresa escolhida)
function byOrganizationParam(request, list) {
  const organizationId = eqParam(request, 'organization_id')

  return organizationId ? list.filter((row) => row.organization_id === organizationId) : list
}

function byProjectParam(request, list) {
  const projectId = eqParam(request, 'project_id')

  return projectId ? list.filter((row) => row.project_id === projectId) : list
}

const githubError = (message) => HttpResponse.json({ error: message }, { status: 400 })

// Sincroniza os repositórios ligados ao projeto: 1 PR e 1 branch "main" por repositório
function syncProject(projectId) {
  const organizationId = db.projects.find(({ id }) => id === projectId).organization_id
  const linked = db.projectRepositories.filter((link) => link.project_id === projectId)

  if (linked.length === 0) {
    return githubError('Escolha os repositórios do projeto antes de sincronizar.')
  }

  for (const { repository_id: repositoryId } of linked) {
    const repository = db.repositories.find(({ id }) => id === repositoryId)

    db.pullRequests = [
      ...db.pullRequests.filter((pr) => pr.repository_id !== repositoryId),
      {
        id: `pr-${repositoryId}`,
        repository_id: repositoryId,
        organization_id: organizationId,
        number: 12,
        title: `Integração com o GitHub (${repository.name})`,
        state: 'open',
        draft: false,
        author_login: 'dono-gh',
        approval_count: 1,
        html_url: `${repository.html_url}/pull/12`,
        created_at_github: new Date().toISOString(),
        merged_at: null,
      },
    ]
    db.branches = [
      ...db.branches.filter((branch) => branch.repository_id !== repositoryId),
      {
        id: `branch-${repositoryId}`,
        repository_id: repositoryId,
        organization_id: organizationId,
        name: 'main',
        last_commit_sha: 'abc1234def',
        protected: true,
      },
    ]
  }

  Object.assign(
    db.githubCredentials.find((row) => row.project_id === projectId),
    { last_synced_at: new Date().toISOString(), last_sync_error: null },
  )
  return HttpResponse.json({
    repositoryCount: linked.length,
    unavailableCount: 0,
    pullRequestCount: linked.length,
    branchCount: linked.length,
    commitCount: linked.length,
  })
}

// Igual ao trigger delete_orphan_repository: repositório sem projeto sai
function unlink(predicate) {
  db.projectRepositories = db.projectRepositories.filter((link) => !predicate(link))
  db.repositories = db.repositories.filter((repository) =>
    db.projectRepositories.some((link) => link.repository_id === repository.id),
  )
}

// Edge Function `github` simulada: aceita só validGitHubToken e enxerga githubAvailable
function githubFunction({ action, projectId, token, githubIds }) {
  if (action === 'connect') {
    if (token !== validGitHubToken) {
      return githubError('Chave do GitHub inválida ou expirada. Gere uma nova e conecte de novo.')
    }

    db.githubCredentials = [
      ...db.githubCredentials.filter((row) => row.project_id !== projectId),
      {
        project_id: projectId,
        token_last4: token.slice(-4),
        github_login: 'dono-gh',
        last_synced_at: null,
      },
    ]
    return HttpResponse.json({ login: 'dono-gh', repositoryCount: githubAvailable.length })
  }

  if (action === 'list') {
    const selected = new Set(
      db.projectRepositories
        .filter((link) => link.project_id === projectId)
        .map((link) => db.repositories.find(({ id }) => id === link.repository_id).github_id),
    )

    return HttpResponse.json({
      repositories: githubAvailable.map((repo) => ({
        githubId: repo.id,
        fullName: repo.full_name,
        description: repo.description,
        private: repo.private,
        selected: selected.has(repo.id),
      })),
    })
  }

  if (action === 'select') {
    const chosen = githubAvailable.filter((repo) => githubIds.includes(repo.id))

    for (const repo of chosen) {
      const id = `repo-${repo.id}`

      if (!db.repositories.some((repository) => repository.id === id)) {
        db.repositories.push({
          id,
          organization_id: db.projects.find((project) => project.id === projectId).organization_id,
          github_id: repo.id,
          full_name: repo.full_name,
          name: repo.name,
          description: repo.description,
          language: 'JavaScript',
          default_branch: 'main',
          html_url: `https://github.com/${repo.full_name}`,
          private: repo.private,
          pushed_at: new Date().toISOString(),
        })
      }

      const linked = db.projectRepositories.some(
        (link) => link.project_id === projectId && link.repository_id === id,
      )
      if (!linked) db.projectRepositories.push({ project_id: projectId, repository_id: id })
    }

    const keep = chosen.map((repo) => `repo-${repo.id}`)
    unlink((link) => link.project_id === projectId && !keep.includes(link.repository_id))
    return syncProject(projectId)
  }

  if (action === 'sync') return syncProject(projectId)

  db.githubCredentials = db.githubCredentials.filter((row) => row.project_id !== projectId)
  unlink((link) => link.project_id === projectId)
  return HttpResponse.json({ disconnected: true })
}

// audit_events com os filtros que a tela usa e o RLS (só admin e stakeholder)
function auditRows(request) {
  const params = new URL(request.url).searchParams
  const organizationId = eqParam(request, 'organization_id')
  const member = memberOf(organizationId, callerId(request))
  if (!member || !['admin', 'stakeholder'].includes(member.role)) return []

  const since = params.get('created_at')?.replace(/^gte\./, '')
  const action = params.get('action') ?? ''
  const before = params.get('id')?.replace(/^lt\./, '')
  const limit = Number(params.get('limit') ?? Infinity)

  return db.auditEvents
    .filter((event) => event.organization_id === organizationId)
    .filter((event) => !since || event.created_at >= since)
    .filter((event) =>
      action.startsWith('like.')
        ? event.action.startsWith(action.slice(5).replace(/[%*]$/, ''))
        : !action.startsWith('eq.') || event.action === action.slice(3),
    )
    .filter((event) => !before || event.id < Number(before))
    .sort((a, b) => b.id - a.id)
    .slice(0, limit)
}

// Edge Function `assistant` simulada: guarda o pedido e responde citando a pergunta
function assistantFunction(body) {
  db.assistantRequests.push(body)

  if (db.assistantRemaining === 0) {
    return HttpResponse.json(
      { error: 'Limite de perguntas de hoje atingido (20 por pessoa). Volte amanhã.' },
      { status: 429 },
    )
  }

  db.assistantRemaining -= 1
  return HttpResponse.json({
    answer: `Resposta simulada para: ${body.messages.at(-1).content}`,
    remaining: db.assistantRemaining,
  })
}

export const handlers = [
  http.get(rest('audit_events'), ({ request }) => rows(request, auditRows(request))),
  // contagem dos cartões: select com head + count=exact
  http.head(rest('audit_events'), ({ request }) => {
    const total = auditRows(request).length
    return new HttpResponse(null, { headers: { 'Content-Range': `*/${total}` } })
  }),

  http.post(`${url}/functions/v1/assistant`, async ({ request }) =>
    assistantFunction(await request.json()),
  ),

  http.post(`${url}/functions/v1/github`, async ({ request }) =>
    githubFunction(await request.json()),
  ),

  http.get(rest('github_credentials'), ({ request }) =>
    rows(request, byProjectParam(request, db.githubCredentials)),
  ),

  // Com ?project_repositories.project_id=eq.<valor>, só os ligados ao projeto
  http.get(rest('repositories'), ({ request }) => {
    const projectId = eqParam(request, 'project_repositories.project_id')

    return rows(
      request,
      byOrganizationParam(request, db.repositories)
        .map((repository) => ({ ...repository, project_repositories: linksOf(repository.id) }))
        .filter(
          (repository) =>
            !projectId ||
            repository.project_repositories.some((link) => link.project_id === projectId),
        ),
    )
  }),

  http.get(rest('project_repositories'), ({ request }) =>
    rows(
      request,
      byProjectParam(request, db.projectRepositories).map((link) => {
        const repository = db.repositories.find(({ id }) => id === link.repository_id)

        return {
          repository: {
            id: repository.id,
            full_name: repository.full_name,
            html_url: repository.html_url,
          },
        }
      }),
    ),
  ),

  http.get(rest('pull_requests'), ({ request }) =>
    rows(request, withRepository(request, byOrganizationParam(request, db.pullRequests))),
  ),

  http.get(rest('commits'), ({ request }) =>
    rows(request, byOrganizationParam(request, db.commits)),
  ),

  http.get(rest('ci_runs'), ({ request }) =>
    rows(request, withRepository(request, byOrganizationParam(request, db.ciRuns))),
  ),

  http.get(rest('governance_scores'), ({ request }) =>
    rows(request, byOrganizationParam(request, db.governanceScores)),
  ),

  http.get(rest('branches'), ({ request }) =>
    rows(request, withRepository(request, byOrganizationParam(request, db.branches))),
  ),

  http.post(`${url}/auth/v1/token`, async ({ request }) => {
    const { email, password } = await request.json()
    const user = db.users.find((candidate) => candidate.email === email)

    if (!user || password !== testPassword) {
      return authError(400, 'invalid_credentials', 'Invalid login credentials')
    }

    return HttpResponse.json(sessionFor(user))
  }),

  // Cadastro com confirmação de e-mail ligada: volta o usuário, sem sessão
  http.post(`${url}/auth/v1/signup`, async ({ request }) => {
    const { email, data } = await request.json()

    if (db.users.some((user) => user.email === email)) {
      return authError(422, 'user_already_exists', 'User already registered')
    }

    return HttpResponse.json({ id: crypto.randomUUID(), email, user_metadata: data })
  }),

  http.post(`${url}/auth/v1/logout`, () => new HttpResponse(null, { status: 204 })),

  http.get(rest('organization_members'), ({ request }) => {
    const select = new URL(request.url).searchParams.get('select')

    // Lista de membros de uma organização, com o perfil de cada um
    if (select.includes('profile:')) {
      const organizationId = eqParam(request, 'organization_id')

      return rows(
        request,
        db.members
          .filter((member) => member.organization_id === organizationId)
          .map((member) => {
            const user = db.users.find(({ id }) => id === member.user_id)

            return {
              user_id: member.user_id,
              role: member.role,
              profile: { full_name: user.user_metadata.full_name, email: user.email },
            }
          }),
      )
    }

    const userId = eqParam(request, 'user_id')
    const members = db.members.filter((member) => member.user_id === userId)

    return rows(
      request,
      members.map((member) =>
        select.includes('organization:')
          ? {
              role: member.role,
              organization: db.organizations.find(({ id }) => id === member.organization_id),
            }
          : { organization_id: member.organization_id },
      ),
    )
  }),

  // RLS: só admin muda papel
  http.patch(rest('organization_members'), async ({ request }) => {
    const member = memberOf(eqParam(request, 'organization_id'), eqParam(request, 'user_id'))
    const isAdmin = memberOf(member?.organization_id, callerId(request))?.role === 'admin'
    const { role } = await request.json()

    if (!member || !isAdmin) return rows(request, [])
    if (role !== 'admin' && leavesWithoutAdmin(member)) return lastAdminError()

    member.role = role
    return rows(request, [{ user_id: member.user_id }])
  }),

  // RLS: admin remove qualquer um; o membro pode sair sozinho
  http.delete(rest('organization_members'), ({ request }) => {
    const member = memberOf(eqParam(request, 'organization_id'), eqParam(request, 'user_id'))
    const caller = callerId(request)
    const allowed =
      member &&
      (member.user_id === caller || memberOf(member.organization_id, caller)?.role === 'admin')

    if (!allowed) return rows(request, [])
    if (leavesWithoutAdmin(member)) return lastAdminError()

    db.members = db.members.filter((other) => other !== member)
    return rows(request, [{ user_id: member.user_id }])
  }),

  http.post(rest('rpc/regenerate_join_code'), async ({ request }) => {
    const { org } = await request.json()
    const organization = db.organizations.find(({ id }) => id === org)

    organization.join_code = 'NOVOCOD001'
    return HttpResponse.json(organization.join_code)
  }),

  http.post(rest('rpc/create_organization'), async ({ request }) => {
    const { org_name: name } = await request.json()
    const organization = { id: crypto.randomUUID(), name, join_code: 'NOVO000001' }

    db.organizations.push(organization)
    db.members.push({ organization_id: organization.id, user_id: db.users[0].id, role: 'admin' })
    return HttpResponse.json(organization.id)
  }),

  http.post(rest('rpc/join_organization'), async ({ request }) => {
    const { code } = await request.json()

    if (code !== otherOrganization.join_code) {
      return HttpResponse.json(
        { code: 'P0002', message: 'Código de organização inválido.' },
        { status: 400 },
      )
    }

    db.members.push({
      organization_id: otherOrganization.id,
      user_id: db.users[0].id,
      role: 'stakeholder',
    })
    return HttpResponse.json(otherOrganization.id)
  }),

  http.get(rest('projects'), ({ request }) =>
    rows(request, byOrganizationParam(request, db.projects)),
  ),

  http.post(rest('projects'), async ({ request }) => {
    const project = { id: crypto.randomUUID(), ...(await request.json()) }

    db.projects.push(project)
    return rows(request, [project], 201)
  }),

  http.patch(rest('projects'), async ({ request }) => {
    const id = eqParam(request, 'id')
    const changes = await request.json()

    db.projects = db.projects.map((project) =>
      project.id === id ? { ...project, ...changes } : project,
    )
    return rows(
      request,
      db.projects.filter((project) => project.id === id),
    )
  }),

  http.delete(rest('projects'), ({ request }) => {
    const id = eqParam(request, 'id')
    const deleted = db.projects.filter((project) => project.id === id)

    db.projects = db.projects.filter((project) => project.id !== id)
    return rows(
      request,
      deleted.map((project) => ({ id: project.id })),
    )
  }),

  // Missão e visão (E10): colunas da organização
  http.get(rest('organizations'), ({ request }) => {
    const id = eqParam(request, 'id')

    return rows(
      request,
      db.organizations.filter((organization) => organization.id === id),
    )
  }),

  http.patch(rest('organizations'), async ({ request }) => {
    const id = eqParam(request, 'id')
    const caller = callerId(request)

    // Igual ao RLS: só o admin altera; quem não pode recebe lista vazia
    if (memberOf(id, caller)?.role !== 'admin') return rows(request, [])

    Object.assign(
      db.organizations.find((organization) => organization.id === id),
      await request.json(),
    )
    return rows(
      request,
      db.organizations.filter((organization) => organization.id === id),
    )
  }),

  // Objetivos estratégicos (E10)
  http.get(rest('strategic_objectives'), ({ request }) =>
    rows(request, byOrganizationParam(request, db.objectives)),
  ),

  http.post(rest('strategic_objectives'), async ({ request }) => {
    const body = await request.json()

    if (memberOf(body.organization_id, callerId(request))?.role !== 'admin') {
      return HttpResponse.json({ code: '42501', message: 'RLS' }, { status: 403 })
    }

    const objective = { id: crypto.randomUUID(), description: '', ...body }

    db.objectives.push(objective)
    return rows(request, [objective], 201)
  }),

  http.patch(rest('strategic_objectives'), async ({ request }) => {
    const id = eqParam(request, 'id')
    const target = db.objectives.find((objective) => objective.id === id)

    if (!target || memberOf(target.organization_id, callerId(request))?.role !== 'admin') {
      return rows(request, [])
    }

    Object.assign(target, await request.json())
    return rows(request, [target])
  }),

  http.delete(rest('strategic_objectives'), ({ request }) => {
    const id = eqParam(request, 'id')
    const target = db.objectives.find((objective) => objective.id === id)

    if (!target || memberOf(target.organization_id, callerId(request))?.role !== 'admin') {
      return rows(request, [])
    }

    db.objectives = db.objectives.filter((objective) => objective.id !== id)
    // Igual ao banco: excluir o objetivo desfaz o vínculo dos projetos
    db.projects = db.projects.map((project) =>
      project.objective_id === id ? { ...project, objective_id: null } : project,
    )
    return rows(request, [{ id }])
  }),
]
