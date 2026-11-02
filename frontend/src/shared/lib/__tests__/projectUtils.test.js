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
      objectiveId: '',
    })
  })

  it('replaces a blank name', () => {
    expect(normalizeProject({ name: '   ' }).name).toBe('Projeto sem nome')
  })

  it('falls back to medium priority when the value is invalid', () => {
    expect(normalizeProject({ priority: 'urgent' }).priority).toBe('medium')
  })

  // Regra P2: o progresso manual foi removido; a coluna antiga fica sem uso no banco
  it('drops the legacy progress field', () => {
    expect(normalizeProject({ progress: 40 })).not.toHaveProperty('progress')
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
