import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import OverviewPage from '@/features/dashboard/OverviewPage'

const now = new Date('2026-11-10T12:00:00Z')
const daysAgo = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()

const projectList = [
  { id: 'p1', name: 'Portal', deadline: '2026-12-31', owner: 'Ana' },
  { id: 'p2', name: 'Folha', deadline: '2026-11-08', owner: 'Bruno' },
  { id: 'p3', name: 'Ouvidoria', deadline: '2026-11-14', owner: 'Carla' },
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

function score(projectId, day, value, overrides = {}) {
  return {
    project_id: projectId,
    day,
    score: value,
    components: { review: value, flow: 100, deadline: 50, protection: 0, leadTime: null },
    reconstructed: false,
    computed_at: `${day}T15:07:00Z`,
    ...overrides,
  }
}

const governance = {
  repositories: [{ id: 'r1', name: 'app', default_branch: 'main', projectIds: ['p1'] }],
  branches: [{ repository_id: 'r1', name: 'main', protected: true }],
  commits: [{ repository_id: 'r1', author_login: 'ana', committed_at: daysAgo(2) }],
  pullRequests: [
    // 2 dias da abertura ao merge, com aprovação
    pr({ number: 1, created_at_github: daysAgo(6), merged_at: daysAgo(4), ci_state: 'success' }),
    // 1 dia, sem aprovação, há 20 dias (fora do período de 7)
    pr({ number: 2, created_at_github: daysAgo(21), merged_at: daysAgo(20), approval_count: 0 }),
    pr({ number: 3, state: 'open', created_at_github: daysAgo(5), merged_at: null }),
  ],
  scores: [
    score('p1', '2026-11-01', 60, { reconstructed: true }),
    score('p1', '2026-11-03', 66, { reconstructed: true }),
    score('p1', '2026-11-10', 72),
    score('p2', '2026-11-10', 90),
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
    expect(card('CI verde no merge')).toHaveTextContent('100%')
  })

  it('says when no merged PR of the period has CI', async () => {
    renderOverview({
      governance: {
        ...governance,
        pullRequests: governance.pullRequests.map((item) => ({ ...item, ci_state: null })),
      },
    })

    expect(card('CI verde no merge')).toHaveTextContent('—')
    expect(card('CI verde no merge')).toHaveTextContent('Nenhum PR mergeado com CI')
  })

  it('recomputes the numbers when the period changes', async () => {
    const { user } = renderOverview()

    await user.click(screen.getByRole('button', { name: '7 dias' }))

    expect(card('Quantidade de PRs')).toHaveTextContent('2')
    expect(card('Lead time médio')).toHaveTextContent('2 dias')
    expect(card('Taxa de aprovação')).toHaveTextContent('100%')
    expect(screen.getByRole('button', { name: 'O que é contado' })).toHaveAccessibleDescription(
      /nos últimos 7 dias/,
    )
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
    expect(
      screen.getByRole('button', { name: 'Como o status é calculado' }),
    ).toHaveAccessibleDescription(/O status vem dos alertas automáticos/)
  })

  it('lists the automated alerts, the most critical first, with the reason', () => {
    renderOverview()

    const alerts = within(
      screen.getByRole('heading', { name: 'Alertas Automatizados' }).closest('section'),
    ).getAllByRole('listitem')

    expect(alerts.map((item) => item.querySelector('strong').textContent)).toEqual([
      'Risco: Prazo vencido',
      'Risco: PR aberto há 5 dias',
      'Atenção: PR mergeado sem aprovação',
      'Atenção: Prazo perto do fim',
    ])
    expect(within(alerts[1]).getByRole('link', { name: '#3 · app · PR 3' })).toHaveAttribute(
      'href',
      'https://github.com/o/app/pull/3',
    )
    expect(alerts[2]).toHaveTextContent(/sem nenhuma revisão aprovada/)
  })

  it('shows every alert on demand instead of hiding the extra ones', async () => {
    const stale = Array.from({ length: 10 }, (_, index) =>
      pr({ number: 10 + index, state: 'open', created_at_github: daysAgo(2), merged_at: null }),
    )
    const { user } = renderOverview({ governance: { ...governance, pullRequests: stale } })
    const panel = screen.getByRole('heading', { name: 'Alertas Automatizados' }).closest('section')

    expect(within(panel).getAllByRole('listitem')).toHaveLength(8)

    await user.click(within(panel).getByRole('button', { name: 'Ver todos os 12 alertas' }))
    expect(within(panel).getAllByRole('listitem')).toHaveLength(12)

    await user.click(within(panel).getByRole('button', { name: 'Mostrar menos' }))
    expect(within(panel).getAllByRole('listitem')).toHaveLength(8)
  })

  it('tells the user to connect GitHub when nothing is synced', () => {
    renderOverview({
      governance: { pullRequests: [], repositories: [], branches: [], commits: [], scores: [] },
    })

    expect(screen.getByText(/conecte o GitHub em um projeto/)).toBeInTheDocument()
    expect(screen.getByText(/O índice ainda não foi apurado/)).toBeInTheDocument()
    expect(card('Taxa de aprovação')).toHaveTextContent('—')
  })

  describe('governance index', () => {
    const indexPanel = () =>
      screen.getByRole('heading', { name: 'Índice de Governança' }).closest('section')

    it('shows the company score, its band and the change in 7 days', () => {
      renderOverview()
      const panel = within(indexPanel())

      // 10/11: média de 72 e 90; 7 dias antes vale o dia 03/11 (66)
      expect(panel.getByText('/100').closest('p')).toHaveTextContent('81/100')
      expect(panel.getByText('Bom')).toBeInTheDocument()
      expect(panel.getByText('▲ 15 pontos em 7 dias')).toBeInTheDocument()
      expect(
        panel.getByRole('button', { name: 'Como o índice é calculado' }),
      ).toHaveAccessibleDescription(/revisão de código \(peso 30\)/)
    })

    it('breaks the score down by criterion, with the weights', () => {
      renderOverview()
      const items = within(indexPanel()).getAllByRole('listitem')

      expect(items.map((item) => item.textContent)).toEqual([
        'Revisão de código peso 3081',
        'Fluxo de PRs peso 20100',
        'Prazo peso 2050',
        'Proteção da branch peso 150',
        'Lead time peso 15sem dados',
      ])
    })

    it('marks the recalculated days', () => {
      renderOverview()

      expect(
        within(indexPanel()).getByText(/Os dias até 03\/11 foram recalculados/),
      ).toBeInTheDocument()
    })

    it('lets the keyboard walk through the days of the line', async () => {
      const { user } = renderOverview()
      const chart = screen.getByRole('slider', { name: 'Evolução do índice por dia' })

      expect(chart).toHaveAttribute('aria-valuetext', '81 em 10/11')

      await user.tab()
      chart.focus()
      await user.keyboard('{ArrowLeft}')

      expect(chart).toHaveAttribute('aria-valuetext', '66 em 03/11')
    })
  })
})
