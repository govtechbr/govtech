import { DEFAULT_SETTINGS } from '../constants/defaultSettings'
import { STORAGE_KEYS } from '../constants/storageKeys'
import { normalizeProject } from './projectUtils'

export function getStoredProjects(initialProjects = []) {
  const fallbackProjects = Array.isArray(initialProjects)
    ? initialProjects.map((project, index) =>
        normalizeProject(project, index)
      )
    : []

  try {
    const savedProjects = localStorage.getItem(STORAGE_KEYS.projects)

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
    localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(projects))
  } catch (error) {
    console.error('Erro ao salvar projetos:', error)
  }
}

export function getStoredSettings() {
  try {
    const savedSettings = localStorage.getItem(STORAGE_KEYS.settings)

    if (!savedSettings) {
      return DEFAULT_SETTINGS
    }

    const parsedSettings = JSON.parse(savedSettings)

    return {
      ...DEFAULT_SETTINGS,
      ...parsedSettings,
      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...(parsedSettings.notifications || {}),
      },
    }
  } catch (error) {
    console.error('Erro ao carregar configurações:', error)
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings))
  } catch (error) {
    console.error('Erro ao salvar configurações:', error)
  }
}