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
    const userId = eqParam(request, 'user_id')
    const members = db.members.filter((member) => member.user_id === userId)
    const select = new URL(request.url).searchParams.get('select')

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
