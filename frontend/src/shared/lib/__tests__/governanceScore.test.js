import { describe, expect, it } from 'vitest'

import { latestScores, scoreBand, scoreChange, scoreHistory } from '@/shared/lib/governanceScore'

function row(projectId, day, score, overrides = {}) {
  return {
    project_id: projectId,
    day,
    score,
    components: { review: score, flow: 100, deadline: null, protection: 0, leadTime: score },
    reconstructed: false,
    computed_at: `${day}T15:00:00Z`,
    ...overrides,
  }
}

describe('scoreBand', () => {
  it('maps the score to Bom, Regular and Crítico (rule I3)', () => {
    expect(scoreBand(80)).toBe('success')
    expect(scoreBand(79)).toBe('warning')
    expect(scoreBand(60)).toBe('warning')
    expect(scoreBand(59)).toBe('danger')
    expect(scoreBand(null)).toBeNull()
  })
})

describe('latestScores', () => {
  it('keeps the most recent day of each project', () => {
    const latest = latestScores([
      row('p1', '2026-11-02', 70),
      row('p1', '2026-11-01', 50),
      row('p2', '2026-11-01', 90),
    ])

    expect(latest.p1.score).toBe(70)
    expect(latest.p2.score).toBe(90)
  })
})

describe('scoreHistory', () => {
  it('averages the projects that have a score on each day (rule I4)', () => {
    const history = scoreHistory([
      row('p1', '2026-11-02', 70),
      row('p2', '2026-11-02', 91),
      row('p3', '2026-11-02', null),
      row('p1', '2026-11-01', 40, { reconstructed: true }),
    ])

    expect(history.map(({ day, score }) => [day, score])).toEqual([
      ['2026-11-01', 40],
      ['2026-11-02', 81],
    ])
    expect(history[0].reconstructed).toBe(true)
    expect(history[1].reconstructed).toBe(false)
    // critério sem dado em todos os projetos continua sem dado
    expect(history[1].components).toEqual({
      review: 81,
      flow: 100,
      deadline: null,
      protection: 0,
      leadTime: 81,
    })
    expect(history[1].computedAt).toBe('2026-11-02T15:00:00Z')
  })

  it('leaves a day without any score out of the line', () => {
    expect(scoreHistory([row('p1', '2026-11-02', null)])).toEqual([])
  })
})

describe('scoreChange', () => {
  const history = scoreHistory([
    row('p1', '2026-10-25', 60),
    row('p1', '2026-10-30', 65),
    row('p1', '2026-11-02', 72),
  ])

  it('compares the last day with the same day a week earlier', () => {
    expect(scoreChange(history, 7)).toBe(12)
  })

  it('falls back to the closest earlier day, and is null without one', () => {
    expect(scoreChange(history, 5)).toBe(12)
    expect(scoreChange(history.slice(1), 7)).toBeNull()
  })
})
