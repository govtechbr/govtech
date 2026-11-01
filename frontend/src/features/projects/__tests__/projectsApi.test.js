import { http, HttpResponse } from 'msw/http'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  createProject,
  deleteProject,
  listProjects,
  updateProject,
} from '@/features/projects/api/projectsApi'
import { projects as mockProjects } from '@/mocks/mockData'
import { db, signInAs, testOrganization } from '@/test/msw/db'
import { server } from '@/test/msw/server'

const projectsUrl = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/projects`

// Contrato da camada de dados, contra o Supabase simulado pelo MSW (src/test/msw)
describe('projectsApi', () => {
  beforeEach(() => {
    signInAs()
  })

  it('lists the projects returned by the database', async () => {
    const projects = await listProjects()

    expect(projects.map((project) => project.name)).toEqual(
      mockProjects.map((project) => project.name),
    )
  })

  it('creates a normalized project in the user organization', async () => {
    const created = await createProject({ name: 'Portal', progress: 150, status: 'invalid' })

    expect(created).toMatchObject({ name: 'Portal', progress: 100, status: 'success' })
    expect(db.projects.at(-1)).toMatchObject({
      name: 'Portal',
      organization_id: testOrganization.id,
    })
    expect((await listProjects()).at(-1)).toEqual(created)
  })

  it('refuses to create a project without an organization', async () => {
    db.members = []

    await expect(createProject({ name: 'Portal' })).rejects.toThrow(
      'Você ainda não faz parte de uma organização.',
    )
  })

  it('updates only the fields that were sent', async () => {
    const [first] = await listProjects()

    const updated = await updateProject(first.id, { name: 'Renomeado' })

    expect(updated).toEqual({ ...first, name: 'Renomeado' })
  })

  it('rejects updating a project that does not exist or is not allowed', async () => {
    await expect(updateProject('nao-existe', { name: 'X' })).rejects.toThrow(
      'Projeto não encontrado ou sem permissão para alterá-lo.',
    )
  })

  it('deletes a project', async () => {
    const [first] = await listProjects()

    await deleteProject(first.id)

    expect((await listProjects()).some((project) => project.id === first.id)).toBe(false)
  })

  it('reports a delete that removed nothing (RLS blocked it)', async () => {
    await expect(deleteProject('nao-existe')).rejects.toThrow(
      'Projeto não encontrado ou sem permissão para alterá-lo.',
    )
  })

  it('translates a permission error from the database', async () => {
    server.use(
      http.post(projectsUrl, () =>
        HttpResponse.json(
          { code: '42501', message: 'new row violates row-level security policy' },
          { status: 403 },
        ),
      ),
    )

    await expect(createProject({ name: 'Portal' })).rejects.toThrow(
      'Você não tem permissão para esta ação.',
    )
  })
})
