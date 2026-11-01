import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from '@/app/App'
import { renderWithRouter } from '@/test/renderWithRouter'

function sidebar() {
  return screen.getByRole('complementary')
}

describe('App', () => {
  it('renders a single sidebar on the overview (regression #1)', () => {
    renderWithRouter(<App />, { route: '/dashboard' })

    expect(screen.getAllByRole('complementary')).toHaveLength(1)
  })

  it('navigates to the projects page from the sidebar', async () => {
    const { user } = renderWithRouter(<App />, { route: '/dashboard' })

    await user.click(within(sidebar()).getByRole('button', { name: 'Projetos' }))

    expect(await screen.findByRole('button', { name: /novo projeto/i })).toBeInTheDocument()
  })

  it('keeps a created project after remounting', async () => {
    const { user, unmount } = renderWithRouter(<App />, { route: '/projects' })

    await user.click(screen.getByRole('button', { name: /novo projeto/i }))
    await user.type(screen.getByLabelText('Nome do Projeto'), 'Projeto Persistido')
    await user.type(screen.getByLabelText('Objetivo do Projeto'), 'Teste de persistência')
    await user.type(screen.getByLabelText('Deadline'), '2026-12-20')
    await user.type(screen.getByLabelText('Responsável'), 'Dev')
    await user.click(screen.getByRole('button', { name: /criar projeto/i }))
    unmount()

    renderWithRouter(<App />, { route: '/projects' })

    expect(screen.getByRole('heading', { name: 'Projeto Persistido' })).toBeInTheDocument()
  })

  it('shows a toast after creating a project', async () => {
    const { user } = renderWithRouter(<App />, { route: '/projects' })

    await user.click(screen.getByRole('button', { name: /novo projeto/i }))
    await user.type(screen.getByLabelText('Nome do Projeto'), 'Projeto Avisado')
    await user.type(screen.getByLabelText('Objetivo do Projeto'), 'Teste do aviso')
    await user.type(screen.getByLabelText('Deadline'), '2026-12-20')
    await user.type(screen.getByLabelText('Responsável'), 'Dev')
    await user.click(screen.getByRole('button', { name: /criar projeto/i }))

    expect(screen.getByText('Projeto criado com sucesso.')).toBeInTheDocument()
  })

  it('renders the landing page lazily', async () => {
    renderWithRouter(<App />, { route: '/landing' })

    const loginLinks = await screen.findAllByRole('link', { name: /acessar plataforma/i })

    expect(loginLinks[0]).toHaveAttribute('href', '/login')
  })

  it('opens the account menu and goes to settings', async () => {
    const { user } = renderWithRouter(<App />, { route: '/dashboard' })
    const avatar = screen.getByRole('button', { name: /menu da conta/i })

    await user.click(avatar)
    expect(avatar).toHaveAttribute('aria-expanded', 'true')

    await user.click(
      within(screen.getByRole('banner')).getByRole('button', { name: 'Configurações' }),
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Configurações' })).toBeInTheDocument()
  })

  it('switches the workspace from the sidebar', async () => {
    const { user } = renderWithRouter(<App />, { route: '/dashboard' })

    await user.click(within(sidebar()).getByRole('button', { name: /trocar workspace/i }))
    await user.click(within(sidebar()).getByRole('button', { name: /govtech-ti/i }))

    expect(
      within(sidebar()).getByRole('button', { name: 'Trocar workspace (atual: govtech-ti)' }),
    ).toBeInTheDocument()
  })

  describe('global search', () => {
    it('opens from the topbar and closes', async () => {
      const { user } = renderWithRouter(<App />, { route: '/dashboard' })

      await user.click(screen.getByRole('button', { name: 'Buscar' }))
      expect(screen.getByRole('searchbox', { name: /buscar no sistema/i })).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /fechar busca/i }))
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    })

    it('opens the chosen project on the projects page', async () => {
      const { user } = renderWithRouter(<App />, { route: '/dashboard' })

      await user.click(screen.getByRole('button', { name: 'Buscar' }))
      await user.type(screen.getByRole('searchbox'), 'Pagamentos')
      await user.click(screen.getByRole('button', { name: /plataforma de pagamentos/i }))

      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
      expect(await screen.findByRole('button', { name: /editar/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /novo projeto/i })).toBeInTheDocument()
    })
  })
})
