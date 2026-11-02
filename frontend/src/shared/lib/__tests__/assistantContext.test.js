import { describe, expect, it } from 'vitest'

import { buildAssistantContext, MAX_CONTEXT_BYTES } from '@/shared/lib/assistantContext'
import { governanceMetrics } from '@/shared/lib/governance'

const now = new Date('2026-11-10T12:00:00Z')
const daysAgo = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()

function pr(overrides) {
  return {
    id: `pr-${overrides.number}`,
    title: `PR ${overrides.number}`,
    state: 'open',
    draft: false,
    author_login: 'ana',
    approval_count: 0,
    html_url: `https://github.com/o/app/pull/${overrides.number}`,
    created_at_github: daysAgo(0.5),
    merged_at: null,
    closed_at: null,
    repositoryName: 'app',
    projectIds: ['p1'],
    ...overrides,
  }
}

const projects = [
  {
    id: 'p1',
    name: 'Portal',
    owner: 'Ana Souza',
    deadline: '2026-11-12',
    priority: 'alta',
    progress: 40,
  },
  { id: 'p2', name: 'Site', owner: 'Bia Lima', deadline: '', priority: 'baixa', progress: 90 },
]

const governance = {
  repositories: [{ id: 'r1', name: 'app', default_branch: 'main', projectIds: ['p1'] }],
  branches: [{ repository_id: 'r1', name: 'main', protected: false }],
  commits: [{ repository_id: 'r1', author_login: 'ana', committed_at: daysAgo(2) }],
  pullRequests: [
    pr({ number: 1 }),
    pr({ number: 2, created_at_github: daysAgo(5) }),
    pr({ number: 3, state: 'merged', created_at_github: daysAgo(6), merged_at: daysAgo(4) }),
  ],
  scores: [
    {
      project_id: 'p1',
      day: '2026-11-03',
      score: 70,
      components: { review: 50 },
      reconstructed: true,
      computed_at: daysAgo(7),
    },
    {
      project_id: 'p1',
      day: '2026-11-10',
      score: 57,
      components: { review: 5 },
      reconstructed: false,
      computed_at: daysAgo(0),
    },
  ],
}

const build = (overrides = {}) =>
  buildAssistantContext({ organizationName: 'Org A', projects, governance, now, ...overrides })

describe('buildAssistantContext', () => {
  it('summarizes the index with band, 7-day change and history', () => {
    expect(build().index).toEqual({
      score: 57,
      band: 'Crítico',
      day: '2026-11-10',
      changeIn7Days: -13,
      // média dos projetos: critério sem dado fica null
      components: { review: 5, flow: null, deadline: null, protection: null, leadTime: null },
      history: [
        { day: '2026-11-03', score: 70, reconstructed: true },
        { day: '2026-11-10', score: 57, reconstructed: false },
      ],
    })
  })

  it('uses the same 30-day numbers as the dashboard', () => {
    const metrics = governanceMetrics(governance, 30, now)
    const context = build()

    expect(context.metricsLast30Days).toMatchObject({
      pullRequests: metrics.pullRequestCount,
      approvalRatePercent: metrics.approvalRate,
      pullRequestsAtRisk: 1,
      averageLeadTimeHours: 48,
    })
  })

  it('lists projects with status, index and repositories, but not the owner', () => {
    const [portal, site] = build().projects

    expect(portal).toEqual({
      name: 'Portal',
      status: 'Risco',
      deadline: '2026-11-12',
      priority: 'alta',
      progressPercent: 40,
      index: 57,
      indexComponents: { review: 5 },
      repositories: ['app'],
    })
    expect(site).toMatchObject({ status: 'Saudável', deadline: null, index: null })
  })

  it('lists alerts with the level label and project names', () => {
    expect(build().alerts[0]).toEqual({
      level: 'Risco',
      title: 'PR aberto há 5 dias',
      detail: '#2 · app · PR 2',
      projects: ['Portal'],
    })
  })

  it('lists open PRs first, oldest first, and never sends logins (rule IA2)', () => {
    const context = build()

    expect(context.pullRequests.map((item) => item.number)).toEqual([2, 1, 3])
    expect(context.pullRequests[2]).toEqual({
      number: 3,
      repository: 'app',
      title: 'PR 3',
      state: 'merged',
      openedDaysAgo: 6,
      mergedDaysAgo: 4,
      approvals: 0,
      projects: ['Portal'],
    })
    expect(JSON.stringify(context)).not.toMatch(/ana|Ana Souza|login|avatar/i)
  })

  it('drops the oldest PRs from the list when the data is too big', () => {
    const many = Array.from({ length: 30 }, (_, index) =>
      pr({ number: index + 1, title: 'x'.repeat(600) }),
    )
    const context = build({ governance: { ...governance, pullRequests: many } })

    expect(new TextEncoder().encode(JSON.stringify(context)).length).toBeLessThanOrEqual(
      MAX_CONTEXT_BYTES,
    )
    expect(context.pullRequests.length).toBeGreaterThan(0)
    expect(context.pullRequests.length).toBeLessThan(30)
  })

  it('has no index before the first measurement', () => {
    expect(build({ governance: { ...governance, scores: [] } }).index).toBeNull()
  })
})
