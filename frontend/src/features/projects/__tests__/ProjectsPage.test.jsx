import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ProjectsPage from '@/features/projects/ProjectsPage'
import ToastProvider from '@/shared/ui/ToastProvider'

// A API de projetos é trocada por uma versão em memória: o teste não depende de
// onde os dados moram (localStorage hoje, Supabase depois).
const db = vi.hoisted(() => ({ projects: [] }))

vi.mock('@/features/projects/api/projectsApi', () => ({
  listProjects: async () => db.projects,
  createProject: async (data) => {
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

const initialProjects = [
  {
    id: 1,
    name: 'Plataforma de Pagamentos',
    description: 'Pagamentos',
    deadline: '2026-12-01',
    owner: 'Ana',
    priority: 'high',
    status: 'danger',
    progress: 40,
  },
  {
    id: 2,
    name: 'Sistema de Notificações',
    description: 'Notificações',
    deadline: '2026-12-10',
    owner: 'Bruno',
    priority: 'medium',
    status: 'warning',
    progress: 70,
  },
]

beforeEach(() => {
  db.projects = structuredClone(initialProjects)
})

async function renderPage({ initialProjectId } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  const view = render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ProjectsPage initialProjectId={initialProjectId} />
      </ToastProvider>
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
  it('lists projects with their manual status and counters', async () => {
    await renderPage()

    expect(screen.getByRole('heading', { name: 'Plataforma de Pagamentos' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sistema de Notificações' })).toBeInTheDocument()
    expect(screen.getByText('Risco')).toBeInTheDocument()
    expect(screen.getByText('Atenção')).toBeInTheDocument()
    expect(metric('Projetos ativos')).toHaveTextContent('2')
    expect(metric('Em atenção')).toHaveTextContent('1')
    expect(metric('Riscos críticos')).toHaveTextContent('1')
  })

  it('creates a project with the chosen status', async () => {
    const { user } = await renderPage()

    await user.click(screen.getByRole('button', { name: /novo projeto/i }))
    await user.type(screen.getByLabelText('Nome do Projeto'), 'Portal do Cidadão')
    await user.type(screen.getByLabelText('Objetivo do Projeto'), 'Atendimento online')
    await user.type(screen.getByLabelText('Deadline'), '2026-12-20')
    await user.type(screen.getByLabelText('Responsável'), 'Carla')
    await user.selectOptions(screen.getByLabelText('Status'), 'Atenção')
    await user.click(screen.getByRole('button', { name: /criar projeto/i }))

    expect(await screen.findByRole('heading', { name: 'Portal do Cidadão' })).toBeInTheDocument()
    expect(metric('Projetos ativos')).toHaveTextContent('3')
    expect(metric('Em atenção')).toHaveTextContent('2')
    expect(screen.getByRole('status')).toHaveTextContent('Projeto criado com sucesso.')
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
        <ToastProvider>
          <ProjectsPage />
        </ToastProvider>
      </QueryClientProvider>,
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar os projetos',
    )
  })
})
