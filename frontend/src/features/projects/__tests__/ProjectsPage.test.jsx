import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ProjectsPage from '@/features/projects/ProjectsPage'
import { CurrentOrganizationContext } from '@/shared/hooks/useCurrentOrganization'
import ToastProvider from '@/shared/ui/ToastProvider'

// A API de projetos é trocada por uma versão em memória: o teste não depende de
// onde os dados moram (localStorage hoje, Supabase depois).
const db = vi.hoisted(() => ({ projects: [] }))

vi.mock('@/features/projects/api/projectsApi', () => ({
  listProjects: async () => db.projects,
  createProject: async (_organizationId, data) => {
    const project = { ...data, id: db.projects.length + 100 }
    db.projects = [...db.projects, project]
    return project
  },
  updateProject: async (id, data) => {
    db.projects = db.projects.map((project) =>
      project.id === id ? { ...project, ...data } : project,
    )
  },
  deleteProject: async (id) => {
    db.projects = db.projects.filter((project) => project.id !== id)
  },
}))

const currentOrganization = { organization: { id: 'org-a', name: 'Org A', role: 'admin' } }

const initialProjects = [
  {
    id: 1,
    name: 'Plataforma de Pagamentos',
    description: 'Pagamentos',
    deadline: '2026-12-01',
    owner: 'Ana',
    priority: 'high',
    status: 'danger',
  },
  {
    id: 2,
    name: 'Sistema de Notificações',
    description: 'Notificações',
    deadline: '2026-12-10',
    owner: 'Bruno',
    priority: 'medium',
    status: 'warning',
  },
]

beforeEach(() => {
  db.projects = structuredClone(initialProjects)
})

afterEach(() => {
  vi.useRealTimers()
})

// Status calculado pelos alertas (regra P3); a página só exibe
const health = {
  1: {
    status: 'danger',
    alerts: [
      {
        id: 'a1',
        level: 'danger',
        title: 'Prazo vencido',
        detail: 'Plataforma · venceu há 2 dias',
        projectIds: [1],
      },
    ],
  },
  2: {
    status: 'warning',
    alerts: [
      {
        id: 'a2',
        level: 'warning',
        title: 'Branch principal sem proteção',
        detail: 'app · main',
        projectIds: [2],
      },
    ],
  },
}

// Índice de Governança mais recente (regra I1); só o projeto 1 já foi apurado
const scores = {
  1: {
    project_id: 1,
    day: '2026-11-02',
    score: 57,
    components: { review: 5, flow: 100, deadline: 100, protection: 0, leadTime: null },
  },
}

async function renderPage({ initialProjectId } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  const view = render(
    <QueryClientProvider client={queryClient}>
      <CurrentOrganizationContext.Provider value={currentOrganization}>
        <ToastProvider>
          <ProjectsPage initialProjectId={initialProjectId} health={health} scores={scores} />
        </ToastProvider>
      </CurrentOrganizationContext.Provider>
    </QueryClientProvider>,
  )

  // espera a primeira carga da lista
  await screen.findByRole('heading', { name: 'Plataforma de Pagamentos' })

  return { user: userEvent.setup(), ...view }
}

function metric(label) {
  return within(screen.getByText(label).closest('article')).getByRole('strong')
}

describe('ProjectsPage', () => {
  it('lists projects with the status computed from their alerts', async () => {
    await renderPage()

    expect(screen.getByRole('heading', { name: 'Plataforma de Pagamentos' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sistema de Notificações' })).toBeInTheDocument()
    expect(screen.getByText('Risco')).toBeInTheDocument()
    expect(screen.getByText('Atenção')).toBeInTheDocument()
    expect(screen.getByText('Prazo vencido')).toBeInTheDocument()
    expect(metric('Projetos ativos')).toHaveTextContent('2')
    expect(metric('Em atenção')).toHaveTextContent('1')
    expect(metric('Em risco')).toHaveTextContent('1')
  })

  it('shows the alerts behind the status in the project detail', async () => {
    const { user } = await renderPage()

    await user.click(screen.getByRole('button', { name: 'Sistema de Notificações' }))

    const dialog = screen.getByRole('dialog', { name: 'Sistema de Notificações' })
    expect(within(dialog).getByText('Atenção: Branch principal sem proteção')).toBeInTheDocument()
    expect(within(dialog).getByText('app · main')).toBeInTheDocument()
    expect(within(dialog).queryByText('Progresso')).not.toBeInTheDocument()
  })

  it('shows the governance index on the card and its criteria in the detail', async () => {
    const { user } = await renderPage()

    const card = screen
      .getByRole('heading', { name: 'Plataforma de Pagamentos' })
      .closest('article')
    expect(within(card).getByText(/Índice de Governança/)).toHaveTextContent(
      'Índice de Governança 57Crítico',
    )

    await user.click(screen.getByRole('button', { name: 'Plataforma de Pagamentos' }))
    const dialog = screen.getByRole('dialog', { name: 'Plataforma de Pagamentos' })
    expect(within(dialog).getByText('Revisão de código').closest('li')).toHaveTextContent(
      'Revisão de código peso 305',
    )
    expect(within(dialog).getByText('Lead time').closest('li')).toHaveTextContent('sem dados')

    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Sistema de Notificações' }))
    expect(
      within(screen.getByRole('dialog', { name: 'Sistema de Notificações' })).getByText(
        /Ainda não apurado/,
      ),
    ).toBeInTheDocument()
  })

  it('creates a project without a manual status (it is computed)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 2, 10, 0))
    const { user } = await renderPage()

    await user.click(screen.getByRole('button', { name: /novo projeto/i }))
    await user.type(screen.getByLabelText('Nome do Projeto'), 'Portal do Cidadão')
    await user.type(screen.getByLabelText('Objetivo do Projeto'), 'Atendimento online')
    await user.click(screen.getByLabelText('Deadline'))
    await user.click(screen.getByRole('button', { name: 'Próximo mês' }))
    await user.click(screen.getByRole('button', { name: '20 de dezembro de 2026' }))
    await user.click(screen.getByLabelText('Prioridade'))
    await user.click(screen.getByRole('option', { name: 'Alta' }))
    await user.type(screen.getByLabelText('Responsável'), 'Carla')
    expect(screen.queryByLabelText('Status')).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Progresso/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /criar projeto/i }))

    expect(await screen.findByRole('heading', { name: 'Portal do Cidadão' })).toBeInTheDocument()
    expect(metric('Projetos ativos')).toHaveTextContent('3')
    expect(metric('Em atenção')).toHaveTextContent('1')
    expect(screen.getByRole('status')).toHaveTextContent('Projeto criado com sucesso.')
  })

  it('asks for the deadline before creating a project', async () => {
    const { user } = await renderPage()

    await user.click(screen.getByRole('button', { name: /novo projeto/i }))
    await user.type(screen.getByLabelText('Nome do Projeto'), 'Portal do Cidadão')
    await user.type(screen.getByLabelText('Objetivo do Projeto'), 'Atendimento online')
    await user.type(screen.getByLabelText('Responsável'), 'Carla')
    await user.click(screen.getByRole('button', { name: /criar projeto/i }))

    expect(screen.getByLabelText('Deadline')).toHaveAccessibleDescription('Informe o deadline.')
    expect(screen.getByRole('dialog', { name: 'Novo Projeto' })).toBeInTheDocument()
  })

  it('edits an existing project', async () => {
    const { user } = await renderPage()

    await user.click(screen.getByRole('button', { name: 'Sistema de Notificações' }))
    await user.click(screen.getByRole('button', { name: /editar/i }))

    const nameInput = screen.getByLabelText('Nome do Projeto')
    expect(nameInput).toHaveValue('Sistema de Notificações')

    await user.clear(nameInput)
    await user.type(nameInput, 'Central de Avisos')
    await user.click(screen.getByRole('button', { name: /salvar projeto/i }))

    expect(await screen.findByRole('heading', { name: 'Central de Avisos' })).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Sistema de Notificações' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Projeto atualizado com sucesso.')
  })

  it('deletes a project after confirmation', async () => {
    const { user } = await renderPage()

    await user.click(screen.getByRole('button', { name: 'Plataforma de Pagamentos' }))
    await user.click(screen.getByRole('button', { name: 'Excluir' }))
    await user.click(screen.getByRole('button', { name: /excluir projeto/i }))

    expect(await screen.findByRole('status')).toHaveTextContent('Projeto excluído com sucesso.')
    expect(
      screen.queryByRole('heading', { name: 'Plataforma de Pagamentos' }),
    ).not.toBeInTheDocument()
    expect(metric('Projetos ativos')).toHaveTextContent('1')
  })

  it('opens a project card with the keyboard and closes it with Escape', async () => {
    const { user } = await renderPage()

    screen.getByRole('button', { name: 'Sistema de Notificações' }).focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('dialog', { name: 'Sistema de Notificações' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens the project given by initialProjectId', async () => {
    await renderPage({ initialProjectId: 2 })

    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: 'Sistema de Notificações' })).toHaveLength(2)
  })

  it('keeps the project when deletion is cancelled', async () => {
    const { user } = await renderPage()

    await user.click(screen.getByRole('button', { name: 'Plataforma de Pagamentos' }))
    await user.click(screen.getByRole('button', { name: 'Excluir' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('button', { name: /excluir projeto/i })).not.toBeInTheDocument()
    expect(metric('Projetos ativos')).toHaveTextContent('2')
  })
})

describe('ProjectsPage loading and errors', () => {
  it('shows an error message when the projects cannot be loaded', async () => {
    const api = await import('@/features/projects/api/projectsApi')
    vi.spyOn(api, 'listProjects').mockRejectedValueOnce(new Error('offline'))
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={queryClient}>
        <CurrentOrganizationContext.Provider value={currentOrganization}>
          <ToastProvider>
            <ProjectsPage />
          </ToastProvider>
        </CurrentOrganizationContext.Provider>
      </QueryClientProvider>,
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar os projetos',
    )
  })
})
