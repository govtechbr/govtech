// Rodar com: node --test "backend/supabase/functions/github/*.test.js"
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { projectScore, reconstructionDays, scoreDay } from './score.js'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
// 12:00 em Campo Grande (UTC-4)
const now = new Date('2026-11-10T16:00:00Z')
const ago = (ms) => new Date(now.getTime() - ms).toISOString()

const repositories = [{ id: 'r1', default_branch: 'main' }]
const protectedMain = [{ repository_id: 'r1', name: 'main', protected: true }]

function pr(overrides) {
  return {
    repository_id: 'r1',
    state: 'merged',
    draft: false,
    approval_count: 1,
    created_at_github: ago(2 * DAY),
    merged_at: ago(DAY),
    closed_at: ago(DAY),
    ...overrides,
  }
}

function score(overrides = {}) {
  return projectScore(
    {
      pullRequests: [],
      repositories,
      branches: protectedMain,
      deadline: null,
      ...overrides,
    },
    now,
  )
}

describe('projectScore', () => {
  it('gives 100 to a project with nothing wrong', () => {
    const result = score({
      pullRequests: [pr({ created_at_github: ago(10 * HOUR), merged_at: ago(2 * HOUR) })],
      deadline: '2026-12-31',
    })

    assert.deepEqual(result.components, {
      review: 100,
      flow: 100,
      deadline: 100,
      protection: 100,
      leadTime: 100,
    })
    assert.equal(result.score, 100)
  })

  it('weighs the criteria 30/20/20/15/15', () => {
    // revisão 0, fluxo 100, prazo 0 (vencido), proteção 0, lead time 0 (7 dias)
    const result = score({
      pullRequests: [
        pr({ approval_count: 0, created_at_github: ago(8 * DAY), merged_at: ago(DAY) }),
      ],
      branches: [{ repository_id: 'r1', name: 'main', protected: false }],
      deadline: '2026-11-01',
    })

    assert.deepEqual(result.components, {
      review: 0,
      flow: 100,
      deadline: 0,
      protection: 0,
      leadTime: 0,
    })
    assert.equal(result.score, 20)
  })

  it('leaves out the criteria without data and rescales the weights', () => {
    // sem PR mergeado e sem prazo: só fluxo (20) e proteção (15)
    const result = score({ branches: [{ repository_id: 'r1', name: 'main', protected: false }] })

    assert.equal(result.components.review, null)
    assert.equal(result.components.leadTime, null)
    assert.equal(result.components.deadline, null)
    // (100 × 20 + 0 × 15) / 35
    assert.equal(result.score, 57)
  })

  it('is null when no criterion has data', () => {
    const result = score({ repositories: [], branches: [] })

    assert.equal(result.score, null)
  })

  it('scores open PRs by age and ignores drafts', () => {
    const result = score({
      pullRequests: [
        pr({ state: 'open', merged_at: null, closed_at: null, created_at_github: ago(12 * HOUR) }),
        pr({ state: 'open', merged_at: null, closed_at: null, created_at_github: ago(2 * DAY) }),
        pr({ state: 'open', merged_at: null, closed_at: null, created_at_github: ago(5 * DAY) }),
        pr({
          state: 'open',
          draft: true,
          merged_at: null,
          closed_at: null,
          created_at_github: ago(9 * DAY),
        }),
      ],
    })

    // (100 + 50 + 0) / 3
    assert.equal(result.components.flow, 50)
  })

  it('uses the median lead time on a linear scale from 1 to 7 days', () => {
    const merged = (hours) =>
      pr({ created_at_github: ago(DAY + hours * HOUR), merged_at: ago(DAY) })

    // mediana 96 h = 4 dias: (168 − 96) / (168 − 24) = 50
    assert.equal(
      score({ pullRequests: [merged(10), merged(96), merged(400)] }).components.leadTime,
      50,
    )
  })

  it('only counts PRs merged in the last 30 days', () => {
    const result = score({
      pullRequests: [
        pr({ approval_count: 0, created_at_github: ago(41 * DAY), merged_at: ago(40 * DAY) }),
        pr({ approval_count: 1 }),
      ],
    })

    assert.equal(result.components.review, 100)
  })

  it('gives 50 to a deadline within 7 days, counting days in the MS time zone', () => {
    assert.equal(score({ deadline: '2026-11-17' }).components.deadline, 50)
    assert.equal(score({ deadline: '2026-11-10' }).components.deadline, 50)
    assert.equal(score({ deadline: '2026-11-18' }).components.deadline, 100)
    assert.equal(score({ deadline: '2026-11-09' }).components.deadline, 0)
  })

  it('counts only repositories whose main branch is known for protection', () => {
    const result = score({
      repositories: [...repositories, { id: 'r2', default_branch: 'main' }],
      branches: [
        ...protectedMain,
        { repository_id: 'r2', name: 'main', protected: false },
        { repository_id: 'r2', name: 'feature', protected: true },
      ],
    })

    assert.equal(result.components.protection, 50)
  })

  it('rebuilds a past day from the PR dates', () => {
    // hoje mergeado sem aprovação; 3 dias atrás ainda estava aberto, com 2 dias de vida
    const pullRequests = [
      pr({ approval_count: 0, created_at_github: ago(5 * DAY), merged_at: ago(DAY) }),
    ]
    const past = projectScore(
      { pullRequests, repositories, branches: protectedMain, deadline: null },
      new Date(now.getTime() - 3 * DAY),
    )

    assert.equal(past.components.review, null)
    assert.equal(past.components.flow, 50)
    assert.equal(score({ pullRequests }).components.review, 0)
  })
})

describe('scoreDay', () => {
  it('uses the calendar day in Campo Grande (UTC-4)', () => {
    assert.equal(scoreDay(new Date('2026-11-10T03:59:00Z')), '2026-11-09')
    assert.equal(scoreDay(new Date('2026-11-10T04:00:00Z')), '2026-11-10')
  })
})

describe('reconstructionDays', () => {
  it('lists the end of each of the 30 previous days, oldest first', () => {
    const days = reconstructionDays(now, [{ created_at_github: '2026-01-01T00:00:00Z' }])

    assert.equal(days.length, 30)
    assert.equal(scoreDay(days[0]), '2026-10-11')
    assert.equal(scoreDay(days[29]), '2026-11-09')
    // fim do dia em Campo Grande: 23:59:59 local = 03:59:59 UTC do dia seguinte
    assert.equal(days[29].toISOString(), '2026-11-10T03:59:59.000Z')
  })

  it('starts on the day of the first PR, so days without activity are not invented', () => {
    // primeiro PR em 07/11 às 10:00 de Campo Grande
    const days = reconstructionDays(now, [
      { created_at_github: '2026-11-08T12:00:00Z' },
      { created_at_github: '2026-11-07T14:00:00Z' },
    ])

    assert.deepEqual(days.map(scoreDay), ['2026-11-07', '2026-11-08', '2026-11-09'])
  })

  it('rebuilds nothing for a project without PRs', () => {
    assert.deepEqual(reconstructionDays(now, []), [])
  })
})
