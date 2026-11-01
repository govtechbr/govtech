import { http, HttpResponse } from 'msw/http'

import { db, otherOrganization, sessionFor, testPassword } from '@/test/msw/db'

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

export const handlers = [
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
      role: 'viewer',
    })
    return HttpResponse.json(otherOrganization.id)
  }),

  http.get(rest('projects'), ({ request }) => rows(request, db.projects)),

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
]
