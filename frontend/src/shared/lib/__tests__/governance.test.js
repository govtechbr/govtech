import { describe, expect, it } from 'vitest'

import {
  ciIncidents,
  governanceAlerts,
  governanceMetrics,
  projectHealth,
  weeklyFlow,
} from '@/shared/lib/governance'

const now = new Date('2026-11-10T12:00:00Z')
const daysAgo = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()

function pr(overrides) {
  return {
    id: overrides.number,
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

const data = {
  repositories: [
    { id: 'r1', name: 'app', default_branch: 'main', projectIds: ['p1'] },
    { id: 'r2', name: 'site', default_branch: 'main', projectIds: ['p2'] },
  ],
  branches: [
    { repository_id: 'r1', name: 'main', protected: false },
    { repository_id: 'r1', name: 'feature', protected: false },
    { repository_id: 'r2', name: 'main', protected: true },
  ],
  commits: [
    { repository_id: 'r1', author_login: 'ana', committed_at: daysAgo(2) },
    { repository_id: 'r1', author_login: 'bia', committed_at: daysAgo(20) },
    { repository_id: 'r1', author_login: null, committed_at: daysAgo(3) },
    { repository_id: 'r2', author_login: 'caio', committed_at: daysAgo(60) },
  ],
  pullRequests: [
    pr({ number: 1 }),
    pr({ number: 2, created_at_github: daysAgo(2) }),
    pr({ number: 3, created_at_github: daysAgo(5), author_login: 'dani' }),
    pr({ number: 4, created_at_github: daysAgo(10), draft: true }),
    pr({
      number: 5,
      state: 'merged',
      created_at_github: daysAgo(6),
      merged_at: daysAgo(4),
      approval_count: 1,
    }),
    pr({ number: 6, state: 'merged', created_at_github: daysAgo(25), merged_at: daysAgo(24) }),
    pr({ number: 7, state: 'merged', created_at_github: daysAgo(80), merged_at: daysAgo(79) }),
    pr({ number: 8, state: 'closed', created_at_github: daysAgo(3), closed_at: daysAgo(1) }),
  ],
}

describe('governanceMetrics', () => {
  it('counts the PRs open now plus the ones created in the period', () => {
    // 7 dias: abertos 1, 2, 3, 4 + criados no período 5 e 8
    expect(governanceMetrics(data, 7, now).pullRequestCount).toBe(6)
    // 30 dias: + o 6
    expect(governanceMetrics(data, 30, now).pullRequestCount).toBe(7)
  })

  it('averages the lead time from opening to merge in the period', () => {
    expect(governanceMetrics(data, 7, now).leadTimeHours).toBe(48)
    // (48 h + 24 h) / 2
    expect(governanceMetrics(data, 30, now).leadTimeHours).toBe(36)
  })

  it('computes the share of merged PRs with at least one approval', () => {
    expect(governanceMetrics(data, 7, now).approvalRate).toBe(100)
    expect(governanceMetrics(data, 30, now).approvalRate).toBe(50)
    expect(governanceMetrics({ ...data, pullRequests: [] }, 30, now).approvalRate).toBeNull()
    expect(governanceMetrics({ ...data, pullRequests: [] }, 30, now).leadTimeHours).toBeNull()
  })

  it('counts open PRs older than 3 days as at risk, ignoring drafts', () => {
    expect(governanceMetrics(data, 30, now).atRiskCount).toBe(1)
  })

  it('counts development events in the period', () => {
    expect(governanceMetrics(data, 7, now).events).toEqual({
      repositories: 2,
      commits: 2,
      branches: 3,
      // ana (commit e PRs), dani (PR #3); commit sem login não conta
      contributors: 2,
    })
    expect(governanceMetrics(data, 90, now).events.contributors).toBe(4)
  })

  it('splits the PRs of the period by state', () => {
    expect(governanceMetrics(data, 7, now).distribution).toEqual({
      open: 3,
      draft: 1,
      merged: 1,
      closed: 1,
    })
  })
})

describe('weeklyFlow', () => {
  it('counts opened and merged PRs per week, oldest first', () => {
    const weeks = weeklyFlow(data.pullRequests, 4, now)

    expect(weeks).toHaveLength(4)
    expect(weeks.at(-1)).toMatchObject({ label: '03/11', opened: 5, merged: 1 })
    expect(weeks.at(-2)).toMatchObject({ opened: 1, merged: 0 })
    expect(weeks.at(-4)).toMatchObject({ opened: 1, merged: 1 })
  })
})

describe('governanceAlerts', () => {
  const projects = [
    { id: 'p1', name: 'Portal', deadline: '2026-11-08' },
    { id: 'p2', name: 'Site', deadline: '2026-11-15' },
    { id: 'p3', name: 'Folha', deadline: '2026-12-31' },
    { id: 'p4', name: 'Sem prazo', deadline: '' },
  ]

  // §6: Risco antes de Atenção; dentro do nível, os riscos estruturais primeiro
  it('raises the alerts of §6, the most critical first', () => {
    const alerts = governanceAlerts(data, projects, now)

    expect(alerts.map(({ level, title }) => `${level}: ${title}`)).toEqual([
      'danger: Prazo vencido',
      'danger: PR aberto há 5 dias',
      'warning: Branch principal sem proteção',
      'warning: PR mergeado sem aprovação',
      'warning: Prazo perto do fim',
      'warning: PR aberto há 2 dias',
    ])
  })

  it('explains why each alert matters', () => {
    const reasonOf = (start) =>
      governanceAlerts(data, projects, now).find(({ title }) => title.startsWith(start)).reason

    expect(reasonOf('Branch principal')).toMatch(/push direto/)
    expect(reasonOf('PR mergeado sem aprovação')).toMatch(/sem nenhuma revisão aprovada/)
    expect(reasonOf('Prazo vencido')).toMatch(/O prazo passou/)
    expect(reasonOf('Prazo perto do fim')).toMatch(/Faltam poucos dias/)
    expect(reasonOf('PR aberto')).toMatch(/PR parado/)
  })

  it('describes where each alert comes from', () => {
    const alerts = governanceAlerts(data, projects, now)

    expect(alerts.find(({ title }) => title === 'PR aberto há 5 dias')).toMatchObject({
      detail: '#3 · app · PR 3',
      href: 'https://github.com/o/app/pull/3',
      projectIds: ['p1'],
    })
    expect(alerts.find(({ title }) => title === 'Prazo vencido').detail).toBe(
      'Portal · venceu há 2 dias',
    )
    expect(alerts.find(({ title }) => title === 'Prazo perto do fim').detail).toBe(
      'Site · vence em 5 dias',
    )
    expect(alerts.find(({ title }) => title.startsWith('Branch')).detail).toBe('app · main')
  })
})

describe('CI status (rule G10)', () => {
  const projects = [{ id: 'p1', name: 'Portal', deadline: '' }]
  const ci = {
    repositories: [
      { id: 'r1', name: 'app', default_branch: 'main', ci_state: 'failure', projectIds: ['p1'] },
    ],
    branches: [{ repository_id: 'r1', name: 'main', protected: true }],
    commits: [],
    pullRequests: [
      pr({ number: 1, ci_state: 'failure' }),
      pr({ number: 2, ci_state: 'failure', draft: true }),
      pr({
        number: 3,
        state: 'merged',
        merged_at: daysAgo(2),
        approval_count: 1,
        ci_state: 'failure',
      }),
      pr({
        number: 4,
        state: 'merged',
        merged_at: daysAgo(3),
        approval_count: 1,
        ci_state: 'success',
      }),
      pr({
        number: 5,
        state: 'merged',
        merged_at: daysAgo(4),
        approval_count: 1,
        ci_state: 'success',
      }),
      pr({ number: 6, state: 'merged', merged_at: daysAgo(5), approval_count: 1, ci_state: null }),
      pr({
        number: 7,
        state: 'merged',
        merged_at: daysAgo(40),
        approval_count: 1,
        ci_state: 'failure',
      }),
      pr({ number: 8, ci_state: 'pending' }),
    ],
  }

  it('raises the CI alerts, the broken main first', () => {
    const alerts = governanceAlerts(ci, projects, now)

    expect(alerts.map(({ level, title }) => `${level}: ${title}`)).toEqual([
      'danger: CI falhando na branch principal',
      'danger: PR mergeado com CI falhando',
      'warning: PR com CI falhando',
    ])
    expect(alerts[0]).toMatchObject({ detail: 'app · main', projectIds: ['p1'] })
    expect(alerts[1]).toMatchObject({ detail: '#3 · app · PR 3' })
    expect(alerts[2]).toMatchObject({ detail: '#1 · app · PR 1' })
    expect(alerts[0].reason).toMatch(/testes automáticos/)
  })

  it('computes the share of merged PRs with green CI, ignoring PRs without CI', () => {
    expect(governanceMetrics(ci, 30, now).ciSuccessRate).toBe(67)
    expect(governanceMetrics(ci, 90, now).ciSuccessRate).toBe(50)
    expect(governanceMetrics(data, 30, now).ciSuccessRate).toBeNull()
  })
})

describe('CI run history (rule G11)', () => {
  const minutesAgo = (minutes) => new Date(now.getTime() - minutes * 60 * 1000).toISOString()
  function run(overrides) {
    return {
      id: `run-${overrides.run_number}`,
      run_number: overrides.run_number,
      workflow_name: 'CI',
      head_branch: 'fix/x',
      status: 'completed',
      html_url: `https://github.com/o/app/actions/runs/${overrides.run_number}`,
      repositoryName: 'app',
      ...overrides,
    }
  }
  const ciRuns = [
    // falhou e foi corrigida 4 min depois (o caso #60 → #61)
    run({
      run_number: 60,
      conclusion: 'failure',
      started_at: minutesAgo(70),
      completed_at: minutesAgo(69),
    }),
    run({
      run_number: 61,
      conclusion: 'success',
      started_at: minutesAgo(66),
      completed_at: minutesAgo(65),
    }),
    // duas falhas seguidas na main contam como uma, ainda sem correção
    run({
      run_number: 62,
      head_branch: 'main',
      conclusion: 'failure',
      started_at: minutesAgo(30),
      completed_at: minutesAgo(29),
    }),
    run({
      run_number: 63,
      head_branch: 'main',
      conclusion: 'failure',
      started_at: minutesAgo(20),
      completed_at: minutesAgo(19),
    }),
    // outro workflow na mesma branch não corrige a falha do CI
    run({
      run_number: 64,
      head_branch: 'main',
      workflow_name: 'Deploy',
      conclusion: 'success',
      started_at: minutesAgo(10),
      completed_at: minutesAgo(9),
    }),
    // cancelada e rodando não contam na taxa
    run({
      run_number: 65,
      conclusion: 'cancelled',
      started_at: minutesAgo(8),
      completed_at: minutesAgo(7),
    }),
    run({
      run_number: 66,
      status: 'in_progress',
      conclusion: null,
      started_at: minutesAgo(2),
      completed_at: null,
    }),
    // fora do período de 7 dias
    run({
      run_number: 1,
      conclusion: 'failure',
      started_at: daysAgo(20),
      completed_at: daysAgo(20),
    }),
    run({
      run_number: 2,
      conclusion: 'success',
      started_at: daysAgo(19),
      completed_at: daysAgo(19),
    }),
  ]

  it('groups consecutive failures of a workflow and branch until the next success', () => {
    const incidents = ciIncidents(ciRuns, 7, now)

    expect(
      incidents.map(({ runNumber, branch, failedRuns, recoveryHours }) => ({
        runNumber,
        branch,
        failedRuns,
        recoveryHours,
      })),
    ).toEqual([
      { runNumber: 62, branch: 'main', failedRuns: 2, recoveryHours: null },
      { runNumber: 60, branch: 'fix/x', failedRuns: 1, recoveryHours: 4 / 60 },
    ])
    expect(incidents[1]).toMatchObject({
      workflow: 'CI',
      repositoryName: 'app',
      href: 'https://github.com/o/app/actions/runs/60',
    })
  })

  it('computes the share of successful runs and the mean time to fix', () => {
    const week = governanceMetrics({ ...data, ciRuns }, 7, now)
    // concluídas com sucesso ou falha no período: 61, 64 ok; 60, 62, 63 falharam
    expect(week.ciRunSuccessRate).toBe(40)
    expect(week.ciRecoveryHours).toBeCloseTo(4 / 60)

    const month = governanceMetrics({ ...data, ciRuns }, 30, now)
    expect(month.ciRunSuccessRate).toBe(43)
    expect(month.ciRecoveryHours).toBeCloseTo((4 / 60 + 24) / 2)
  })

  it('has no CI numbers without runs', () => {
    const metrics = governanceMetrics(data, 30, now)

    expect(metrics.ciRunSuccessRate).toBeNull()
    expect(metrics.ciRecoveryHours).toBeNull()
    expect(ciIncidents(undefined, 30, now)).toEqual([])
  })
})

describe('projectHealth', () => {
  it('takes the worst alert of each project as its status', () => {
    const projects = [
      { id: 'p1', name: 'Portal', deadline: '2026-12-31' },
      { id: 'p2', name: 'Site', deadline: '2026-12-31' },
      { id: 'p3', name: 'Folha', deadline: '2026-12-31' },
    ]
    const withoutUnprotected = {
      ...data,
      branches: data.branches.map((branch) => ({ ...branch, protected: true })),
      pullRequests: data.pullRequests.filter((item) => item.number === 2),
    }
    const health = projectHealth(projects, withoutUnprotected, now)

    expect(health.p1.status).toBe('warning')
    expect(health.p1.alerts).toHaveLength(1)
    expect(health.p2.status).toBe('success')
    expect(projectHealth(projects, data, now).p1.status).toBe('danger')
  })
})
