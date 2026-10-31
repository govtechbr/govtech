import { storageKeys } from '../constants/storageKeys'
import { normalizeProject } from './projectUtils'

export function getStoredProjects(initialProjects = []) {
  const fallbackProjects = Array.isArray(initialProjects)
    ? initialProjects.map((project, index) =>
        normalizeProject(project, index)
      )
    : []

  try {
    const savedProjects = localStorage.getItem(storageKeys.PROJECTS)

    if (!savedProjects) {
      return fallbackProjects
    }

    const parsedProjects = JSON.parse(savedProjects)

    if (!Array.isArray(parsedProjects)) {
      return fallbackProjects
    }

    return parsedProjects.map((project, index) =>
      normalizeProject(project, index)
    )
  } catch (error) {
    console.error('Erro ao carregar projetos:', error)
    return fallbackProjects
  }
}

export function saveProjects(projects) {
  try {
    localStorage.setItem(storageKeys.PROJECTS, JSON.stringify(projects))
  } catch (error) {
    console.error('Erro ao salvar projetos:', error)
  }
}
