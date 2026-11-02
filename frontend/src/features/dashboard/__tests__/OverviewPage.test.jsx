import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import OverviewPage from '@/features/dashboard/OverviewPage'

const now = new Date('2026-11-10T12:00:00Z')
const daysAgo = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()

const projectList = [
  { id: 'p1', name: 'Portal', deadline: '2026-12-31', owner: 'Ana', progress: 10 },
  { id: 'p2', name: 'Folha', deadline: '2026-11-08', owner: 'Bruno', progress: 50 },
  { id: 'p3', name: 'Ouvidoria', deadline: '2026-11-14', owner: 'Carla', progress: 80 },
]

function pr(overrides) {
  return {
    id: overrides.number,
    title: `PR ${overrides.number}`,
    state: 'merged',
    draft: false,
    author_login: 'ana',
    approval_count: 1,
    html_url: `https://github.com/o/app/pull/${overrides.number}`,
    closed_at: null,
    repositoryName: 'app',
    projectIds: ['p1'],
    ...overrides,
  }
}

const governance = {
  repositories: [{ id: 'r1', name: 'app', default_branch: 'main', projectIds: ['p1'] }],
  branches: [{ repository_id: 'r1', name: 'main', protected: true }],
  commits: [{ repository_id: 'r1', author_login: 'ana', committed_at: daysAgo(2) }],
  pullRequests: [
    // 2 dias da abertura ao merge, com aprovação
    pr({ number: 1, created_at_github: daysAgo(6), merged_at: daysAgo(4) }),
    // 1 dia, sem aprovação, há 20 dias (fora do período de 7)
    pr({ number: 2, created_at_github: daysAgo(21), merged_at: daysAgo(20), approval_count: 0 }),
    pr({ number: 3, state: 'open', created_at_github: daysAgo(5), merged_at: null }),
  ],
}

function renderOverview(props = {}) {
  return {
    user: userEvent.setup(),
    ...render(<OverviewPage projectList={projectList} governance={governance} {...props} />),
  }
}

function card(title) {
  return screen.getByText(title).closest('article')
}

describe('OverviewPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(now)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the four headline numbers of the default 30-day period', () => {
    renderOverview()

    expect(screen.getByRole('button', { name: '30 dias' })).toHaveAttribute('aria-pressed', 'true')
    expect(card('Quantidade de PRs')).toHaveTextContent('3')
    expect(card('Lead time médio')).toHaveTextContent('1,5 dias')
    expect(card('Taxa de aprovação')).toHaveTextContent('50%')
    expect(card('PRs em risco')).toHaveTextContent('1')
  })

  it('recomputes the numbers when the period changes', async () => {
    const { user } = renderOverview()

    await user.click(screen.getByRole('button', { name: '7 dias' }))

    expect(card('Quantidade de PRs')).toHaveTextContent('2')
    expect(card('Lead time médio')).toHaveTextContent('2 dias')
    expect(card('Taxa de aprovação')).toHaveTextContent('100%')
  })

  it('computes each project status from its alerts and explains the rule', () => {
    renderOverview()

    const panel = screen
      .getByRole('heading', { name: 'Status dos Projetos Monitorados' })
      .closest('section')
    const names = within(panel)
      .getAllByText(/^(Portal|Folha|Ouvidoria)$/)
      .map((element) => element.textContent)

    // Portal: PR aberto há 5 dias (risco); Folha: prazo vencido (risco); Ouvidoria: prazo perto (atenção)
    expect(names).toEqual(['Portal', 'Folha', 'Ouvidoria'])
    expect(within(panel).getByText('1 alerta(s): Prazo perto do fim')).toBeInTheDocument()
    expect(screen.getByText('Como o status é calculado')).toBeInTheDocument()
  })

  it('lists the automated alerts, the most serious first', () => {
    renderOverview()

    const alerts = within(
      screen.getByRole('heading', { name: 'Alertas Automatizados' }).closest('section'),
    ).getAllByRole('listitem')

    expect(alerts.map((item) => item.querySelector('strong').textContent)).toEqual([
      'Risco: PR aberto há 5 dias',
      'Risco: Prazo vencido',
      'Atenção: PR mergeado sem aprovação',
      'Atenção: Prazo perto do fim',
    ])
    expect(within(alerts[0]).getByRole('link', { name: '#3 · app · PR 3' })).toHaveAttribute(
      'href',
      'https://github.com/o/app/pull/3',
    )
  })

  it('tells the user to connect GitHub when nothing is synced', () => {
    renderOverview({
      governance: { pullRequests: [], repositories: [], branches: [], commits: [] },
    })

    expect(screen.getByText(/conecte o GitHub em um projeto/)).toBeInTheDocument()
    expect(card('Taxa de aprovação')).toHaveTextContent('—')
  })
})
