import { describe, expect, it } from 'vitest'

import { pullRequestMetrics } from '@/features/repositories/utils/metrics'
import { formatDuration, timeAgo } from '@/shared/lib/date'

const now = new Date('2026-11-02T12:00:00Z')

describe('pullRequestMetrics', () => {
  it('counts open PRs and recent merges, and averages the time to merge', () => {
    const metrics = pullRequestMetrics(
      [
        { state: 'open' },
        { state: 'open' },
        { state: 'closed' },
        // 10 h até o merge
        {
          state: 'merged',
          created_at_github: '2026-11-01T00:00:00Z',
          merged_at: '2026-11-01T10:00:00Z',
        },
        // 30 h até o merge
        {
          state: 'merged',
          created_at_github: '2026-10-30T00:00:00Z',
          merged_at: '2026-10-31T06:00:00Z',
        },
        // mergeado há mais de 30 dias: fora da média
        {
          state: 'merged',
          created_at_github: '2026-09-01T00:00:00Z',
          merged_at: '2026-09-20T00:00:00Z',
        },
      ],
      now,
    )

    expect(metrics).toEqual({ open: 2, mergedLast30Days: 2, averageMergeHours: 20 })
  })

  it('has no average when nothing was merged recently', () => {
    expect(pullRequestMetrics([{ state: 'open' }], now).averageMergeHours).toBeNull()
  })
})

describe('date helpers', () => {
  it('describes how long ago something happened', () => {
    expect(timeAgo('2026-11-02T11:59:30Z', now)).toBe('agora')
    expect(timeAgo('2026-11-02T11:15:00Z', now)).toBe('há 45 min')
    expect(timeAgo('2026-11-02T07:00:00Z', now)).toBe('há 5 h')
    expect(timeAgo('2026-11-01T11:00:00Z', now)).toBe('há 1 dia')
    expect(timeAgo('2026-10-25T12:00:00Z', now)).toBe('há 8 dias')
    expect(timeAgo(null, now)).toBe('—')
  })

  it('formats a duration in hours or days', () => {
    expect(formatDuration(5.4)).toBe('5 h')
    // menos de 1 hora vira minutos (tempo de correção do CI, G11)
    expect(formatDuration(4 / 60)).toBe('4 min')
    expect(formatDuration(0.001)).toBe('1 min')
    expect(formatDuration(60)).toBe('2,5 dias')
    expect(formatDuration(null)).toBe('—')
  })
})
