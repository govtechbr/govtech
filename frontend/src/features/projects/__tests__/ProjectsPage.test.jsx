import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import ProjectsPage from '@/features/projects/ProjectsPage'

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
    repositories: [],
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
    repositories: [],
  },
]

function Harness({ onToast = vi.fn() }) {
  const [projectList, setProjectList] = useState(initialProjects)

  return (
    <ProjectsPage projectList={projectList} setProjectList={setProjectList} onToast={onToast} />
  )
}

function renderPage() {
  const onToast = vi.fn()

  return { user: userEvent.setup(), onToast, ...render(<Harness onToast={onToast} />) }
}

function metric(label) {
  return within(screen.getByText(label).closest('article')).getByRole('strong')
}

describe('ProjectsPage', () => {
  it('lists projects with their manual status and counters', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Plataforma de Pagamentos' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sistema de Notificações' })).toBeInTheDocument()
    expect(screen.getByText('Risco')).toBeInTheDocument()
    expect(screen.getByText('Atenção')).toBeInTheDocument()
    expect(metric('Projetos ativos')).toHaveTextContent('2')
    expect(metric('Em atenção')).toHaveTextContent('1')
    expect(metric('Riscos críticos')).toHaveTextContent('1')
  })

  it('creates a project with the chosen status', async () => {
    const { user, onToast } = renderPage()

    await user.click(screen.getByRole('button', { name: /novo projeto/i }))
    await user.type(screen.getByLabelText('Nome do Projeto'), 'Portal do Cidadão')
    await user.type(screen.getByLabelText('Objetivo do Projeto'), 'Atendimento online')
    await user.type(screen.getByLabelText('Deadline'), '2026-12-20')
    await user.type(screen.getByLabelText('Responsável'), 'Carla')
    await user.selectOptions(screen.getByLabelText('Status'), 'Atenção')
    await user.click(screen.getByRole('button', { name: /criar projeto/i }))

    expect(screen.getByRole('heading', { name: 'Portal do Cidadão' })).toBeInTheDocument()
    expect(metric('Projetos ativos')).toHaveTextContent('3')
    expect(metric('Em atenção')).toHaveTextContent('2')
    expect(onToast).toHaveBeenCalledWith('Projeto criado com sucesso.')
  })

  it('edits an existing project', async () => {
    const { user, onToast } = renderPage()

    await user.click(screen.getByRole('heading', { name: 'Sistema de Notificações' }))
    await user.click(screen.getByRole('button', { name: /editar/i }))

    const nameInput = screen.getByLabelText('Nome do Projeto')
    expect(nameInput).toHaveValue('Sistema de Notificações')

    await user.clear(nameInput)
    await user.type(nameInput, 'Central de Avisos')
    await user.click(screen.getByRole('button', { name: /salvar projeto/i }))

    expect(screen.getByRole('heading', { name: 'Central de Avisos' })).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Sistema de Notificações' }),
    ).not.toBeInTheDocument()
    expect(onToast).toHaveBeenCalledWith('Projeto atualizado com sucesso.')
  })

  it('deletes a project after confirmation', async () => {
    const { user } = renderPage()

    await user.click(screen.getByRole('heading', { name: 'Plataforma de Pagamentos' }))
    await user.click(screen.getByRole('button', { name: 'Excluir' }))
    await user.click(screen.getByRole('button', { name: /excluir projeto/i }))

    expect(
      screen.queryByRole('heading', { name: 'Plataforma de Pagamentos' }),
    ).not.toBeInTheDocument()
    expect(metric('Projetos ativos')).toHaveTextContent('1')
  })

  it('keeps the project when deletion is cancelled', async () => {
    const { user } = renderPage()

    await user.click(screen.getByRole('heading', { name: 'Plataforma de Pagamentos' }))
    await user.click(screen.getByRole('button', { name: 'Excluir' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('button', { name: /excluir projeto/i })).not.toBeInTheDocument()
    expect(metric('Projetos ativos')).toHaveTextContent('2')
  })
})
