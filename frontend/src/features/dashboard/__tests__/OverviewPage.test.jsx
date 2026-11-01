import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import OverviewPage from '@/features/dashboard/OverviewPage'

const projectList = [
  { id: 1, name: 'Portal', deadline: '2026-12-31', owner: 'Ana', progress: 10 },
  { id: 2, name: 'Folha', deadline: '2026-10-01', owner: 'Bruno', progress: 50 },
  { id: 3, name: 'Ouvidoria', deadline: '2026-11-05', owner: 'Carla', progress: 80 },
]

describe('OverviewPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-01T10:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('lists monitored projects from most to least urgent', () => {
    render(<OverviewPage projectList={projectList} />)

    const panel = screen
      .getByRole('heading', { name: 'Status dos Projetos Monitorados' })
      .closest('section')
    const names = within(panel)
      .getAllByText(/^(Portal|Folha|Ouvidoria)$/)
      .map((element) => element.textContent)

    expect(names).toEqual(['Folha', 'Ouvidoria', 'Portal'])
  })

  it('shows the deadline label and progress of each project', () => {
    render(<OverviewPage projectList={projectList} />)

    expect(screen.getByText('Atrasado há 31 dia(s)')).toBeInTheDocument()
    expect(screen.getByText('4 dia(s) restante(s)')).toBeInTheDocument()
    expect(screen.getByText('80%')).toBeInTheDocument()
  })
})
