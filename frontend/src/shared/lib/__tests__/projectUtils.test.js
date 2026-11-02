import { describe, expect, it } from 'vitest'

import { formatProjectDate, normalizeProject } from '@/shared/lib/projectUtils'

describe('normalizeProject', () => {
  it('fills defaults for an empty project', () => {
    const project = normalizeProject({ id: 1 })

    expect(project).toEqual({
      id: 1,
      name: 'Projeto sem nome',
      description: 'Sem descrição cadastrada.',
      deadline: '',
      owner: 'Não definido',
      priority: 'medium',
      progress: 0,
    })
  })

  it('replaces a blank name', () => {
    expect(normalizeProject({ name: '   ' }).name).toBe('Projeto sem nome')
  })

  it('falls back to medium priority when the value is invalid', () => {
    expect(normalizeProject({ priority: 'urgent' }).priority).toBe('medium')
  })

  it('clamps progress between 0 and 100', () => {
    expect(normalizeProject({ progress: 150 }).progress).toBe(100)
    expect(normalizeProject({ progress: -5 }).progress).toBe(0)
    expect(normalizeProject({ progress: '42' }).progress).toBe(42)
    expect(normalizeProject({ progress: 'abc' }).progress).toBe(0)
  })
})

describe('formatProjectDate', () => {
  it('formats an ISO date in pt-BR', () => {
    expect(formatProjectDate('2026-11-18')).toBe('18/11/2026')
  })

  it('returns a dash when there is no date', () => {
    expect(formatProjectDate('')).toBe('-')
  })

  it('returns the raw value when the date is invalid', () => {
    expect(formatProjectDate('amanhã')).toBe('amanhã')
  })
})
