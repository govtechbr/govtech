import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { formatProjectDate, getProjectStatus, normalizeProject } from '@/shared/lib/projectUtils'

describe('getProjectStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-01T10:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns warning when there is no deadline', () => {
    const status = getProjectStatus({ name: 'A' })

    expect(status.key).toBe('warning')
    expect(status.message).toBe('Deadline não configurada')
  })

  it('returns warning when the deadline is invalid', () => {
    const status = getProjectStatus({ deadline: 'not-a-date' })

    expect(status.key).toBe('warning')
    expect(status.message).toBe('Deadline inválida')
  })

  it('returns danger when the deadline has passed', () => {
    const status = getProjectStatus({ deadline: '2026-10-25' })

    expect(status.key).toBe('danger')
    expect(status.daysRemaining).toBeLessThan(0)
    expect(status.message).toMatch(/^Atrasado há \d+ dia\(s\)$/)
  })

  describe('day count', () => {
    it('returns danger one day after the deadline', () => {
      const status = getProjectStatus({ deadline: '2026-10-31' })

      expect(status.key).toBe('danger')
      expect(status.message).toBe('Atrasado há 1 dia(s)')
    })

    it('returns warning when the deadline is today', () => {
      const status = getProjectStatus({ deadline: '2026-11-01' })

      expect(status.key).toBe('warning')
      expect(status.message).toBe('Deadline vence hoje')
    })

    it('returns warning 7 days before the deadline', () => {
      const status = getProjectStatus({ deadline: '2026-11-08' })

      expect(status.key).toBe('warning')
      expect(status.daysRemaining).toBe(7)
    })

    it('returns success 8 days before the deadline', () => {
      const status = getProjectStatus({ deadline: '2026-11-09' })

      expect(status.key).toBe('success')
      expect(status.daysRemaining).toBe(8)
    })
  })
})

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
      status: 'success',
      progress: 0,
      repositories: [],
    })
  })

  it('replaces a blank name', () => {
    expect(normalizeProject({ name: '   ' }).name).toBe('Projeto sem nome')
  })

  it('falls back to medium priority when the value is invalid', () => {
    expect(normalizeProject({ priority: 'urgent' }).priority).toBe('medium')
  })

  it('keeps a valid manual status', () => {
    expect(normalizeProject({ status: 'danger' }).status).toBe('danger')
  })

  it('falls back to success when the status is invalid', () => {
    expect(normalizeProject({ status: 'toString' }).status).toBe('success')
  })

  it('clamps progress between 0 and 100', () => {
    expect(normalizeProject({ progress: 150 }).progress).toBe(100)
    expect(normalizeProject({ progress: -5 }).progress).toBe(0)
    expect(normalizeProject({ progress: '42' }).progress).toBe(42)
    expect(normalizeProject({ progress: 'abc' }).progress).toBe(0)
  })

  it('keeps only string repositories', () => {
    const project = normalizeProject({ repositories: ['api', 3, null, 'web'] })

    expect(project.repositories).toEqual(['api', 'web'])
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
