import { describe, expect, it } from 'vitest'

import {
  createProject,
  deleteProject,
  listProjects,
  updateProject,
} from '@/features/projects/api/projectsApi'
import { projects as mockProjects } from '@/mocks/mockData'

// Contrato que a implementação com Supabase também precisa cumprir.
describe('projectsApi', () => {
  it('starts from the mock projects when nothing is stored', async () => {
    const projects = await listProjects()

    expect(projects.map((project) => project.name)).toEqual(
      mockProjects.map((project) => project.name),
    )
  })

  it('creates a normalized project and persists it', async () => {
    const created = await createProject({ name: 'Portal', progress: 150, status: 'invalid' })

    expect(created).toMatchObject({ name: 'Portal', progress: 100, status: 'success' })
    expect((await listProjects()).at(-1)).toEqual(created)
  })

  it('updates an existing project', async () => {
    const [first] = await listProjects()

    const updated = await updateProject(first.id, { name: 'Renomeado' })

    expect(updated).toMatchObject({ id: first.id, name: 'Renomeado' })
    expect((await listProjects()).find((project) => project.id === first.id).name).toBe('Renomeado')
  })

  it('rejects updating a project that does not exist', async () => {
    await expect(updateProject(-1, { name: 'X' })).rejects.toThrow('Projeto não encontrado.')
  })

  it('deletes a project', async () => {
    const [first] = await listProjects()

    await deleteProject(first.id)

    expect((await listProjects()).some((project) => project.id === first.id)).toBe(false)
  })
})
