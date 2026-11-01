import { getStoredProjects, saveProjects } from '@/features/projects/utils/storageUtils'
import { projects as mockProjects } from '@/mocks/mockData'
import { normalizeProject } from '@/shared/lib/projectUtils'

// Único ponto de acesso aos dados de projeto. Hoje lê e grava no localStorage
// (com os mocks como ponto de partida); na fase Supabase só este arquivo muda.
// As funções são async para já terem o mesmo formato de uma chamada de rede.

export async function listProjects() {
  return getStoredProjects(mockProjects)
}

export async function createProject(data) {
  const projects = getStoredProjects(mockProjects)
  const project = normalizeProject({ ...data, id: Date.now() })

  saveProjects([...projects, project])
  return project
}

export async function updateProject(id, data) {
  const projects = getStoredProjects(mockProjects)
  const current = projects.find((project) => project.id === id)

  if (!current) {
    throw new Error('Projeto não encontrado.')
  }

  const updated = normalizeProject({ ...current, ...data, id })
  saveProjects(projects.map((project) => (project.id === id ? updated : project)))
  return updated
}

export async function deleteProject(id) {
  const projects = getStoredProjects(mockProjects)

  saveProjects(projects.filter((project) => project.id !== id))
}
