import { afterEach, describe, expect, it, vi } from 'vitest'

import { storageKeys } from '../../constants/storageKeys'
import { getStoredProjects, saveProjects } from '../storageUtils'

const initialProjects = [{ id: 1, name: 'Mock', status: 'warning' }]

describe('getStoredProjects', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the normalized mock when storage is empty', () => {
    const projects = getStoredProjects(initialProjects)

    expect(projects).toHaveLength(1)
    expect(projects[0]).toMatchObject({ id: 1, name: 'Mock', status: 'warning' })
  })

  it('returns the stored projects when they exist', () => {
    localStorage.setItem(storageKeys.PROJECTS, JSON.stringify([{ id: 7, name: 'Salvo' }]))

    const projects = getStoredProjects(initialProjects)

    expect(projects).toHaveLength(1)
    expect(projects[0]).toMatchObject({ id: 7, name: 'Salvo' })
  })

  it('falls back to the mock when the stored JSON is corrupted', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    localStorage.setItem(storageKeys.PROJECTS, '{corrompido')

    const projects = getStoredProjects(initialProjects)

    expect(projects[0].name).toBe('Mock')
    expect(console.error).toHaveBeenCalled()
  })

  it('falls back to the mock when the stored value is not an array', () => {
    localStorage.setItem(storageKeys.PROJECTS, JSON.stringify({ id: 7 }))

    expect(getStoredProjects(initialProjects)[0].name).toBe('Mock')
  })

  it('returns an empty list when the mock is not an array', () => {
    expect(getStoredProjects(null)).toEqual([])
  })
})

describe('saveProjects', () => {
  it('writes to the govtech:projects key', () => {
    saveProjects([{ id: 1 }])

    expect(localStorage.getItem('govtech:projects')).toBe('[{"id":1}]')
  })

  it('never writes to an undefined key (regression)', () => {
    saveProjects([{ id: 1 }])

    expect(localStorage.getItem('undefined')).toBeNull()
  })
})
