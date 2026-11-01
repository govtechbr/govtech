import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import App from '@/app/App'
import { db, signInAs, testOrganization, testPassword, testUser } from '@/test/msw/db'
import { renderWithRouter } from '@/test/renderWithRouter'

function sidebar() {
  return screen.getByRole('complementary')
}

// Área logada: espera a sessão e as organizações carregarem antes de seguir
async function renderApp(route) {
  const result = renderWithRouter(<App />, { route })

  await screen.findByRole('complementary')
  return result
}

describe('App', () => {
  beforeEach(() => {
    signInAs()
  })

  it('renders a single sidebar on the overview (regression #1)', async () => {
    await renderApp('/dashboard')

    expect(screen.getAllByRole('complementary')).toHaveLength(1)
  })

  it('navigates to the projects page from the sidebar', async () => {
    const { user } = await renderApp('/dashboard')

    await user.click(within(sidebar()).getByRole('button', { name: 'Projetos' }))

    expect(await screen.findByRole('button', { name: /novo projeto/i })).toBeInTheDocument()
  })

  it('keeps a created project after remounting', async () => {
    const { user, unmount } = await renderApp('/projects')

    await user.click(screen.getByRole('button', { name: /novo projeto/i }))
    await user.type(screen.getByLabelText('Nome do Projeto'), 'Projeto Persistido')
    await user.type(screen.getByLabelText('Objetivo do Projeto'), 'Teste de persistência')
    await user.type(screen.getByLabelText('Deadline'), '2026-12-20')
    await user.type(screen.getByLabelText('Responsável'), 'Dev')
    await user.click(screen.getByRole('button', { name: /criar projeto/i }))
    await screen.findByText('Projeto criado com sucesso.')
    unmount()

    await renderApp('/projects')

    expect(await screen.findByRole('heading', { name: 'Projeto Persistido' })).toBeInTheDocument()
  })

  it('shows a toast after creating a project', async () => {
    const { user } = await renderApp('/projects')

    await user.click(screen.getByRole('button', { name: /novo projeto/i }))
    await user.type(screen.getByLabelText('Nome do Projeto'), 'Projeto Avisado')
    await user.type(screen.getByLabelText('Objetivo do Projeto'), 'Teste do aviso')
    await user.type(screen.getByLabelText('Deadline'), '2026-12-20')
    await user.type(screen.getByLabelText('Responsável'), 'Dev')
    await user.click(screen.getByRole('button', { name: /criar projeto/i }))

    expect(await screen.findByText('Projeto criado com sucesso.')).toBeInTheDocument()
  })

  it('renders the landing page lazily', async () => {
    renderWithRouter(<App />, { route: '/landing' })

    const loginLinks = await screen.findAllByRole('link', { name: /acessar plataforma/i })

    expect(loginLinks[0]).toHaveAttribute('href', '/login')
  })

  it('opens the account menu and goes to settings', async () => {
    const { user } = await renderApp('/dashboard')
    const avatar = screen.getByRole('button', { name: 'Menu da conta de Alice Souza' })

    await user.click(avatar)
    expect(avatar).toHaveAttribute('aria-expanded', 'true')

    await user.click(
      within(screen.getByRole('banner')).getByRole('button', { name: 'Configurações' }),
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Configurações' })).toBeInTheDocument()
  })

  it('switches the workspace from the sidebar', async () => {
    const { user } = await renderApp('/dashboard')

    await user.click(within(sidebar()).getByRole('button', { name: /trocar workspace/i }))
    await user.click(within(sidebar()).getByRole('button', { name: /govtech-ti/i }))

    expect(
      within(sidebar()).getByRole('button', { name: 'Trocar workspace (atual: govtech-ti)' }),
    ).toBeInTheDocument()
  })

  describe('global search', () => {
    it('opens from the topbar and closes', async () => {
      const { user } = await renderApp('/dashboard')

      await user.click(screen.getByRole('button', { name: 'Buscar' }))
      expect(screen.getByRole('searchbox', { name: /buscar no sistema/i })).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /fechar busca/i }))
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    })

    it('opens the chosen project on the projects page', async () => {
      const { user } = await renderApp('/dashboard')

      await user.click(screen.getByRole('button', { name: 'Buscar' }))
      await user.type(screen.getByRole('searchbox'), 'Pagamentos')
      await user.click(screen.getByRole('button', { name: /plataforma de pagamentos/i }))

      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
      expect(await screen.findByRole('button', { name: /editar/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /novo projeto/i })).toBeInTheDocument()
    })
  })

  it('points the GitHub integration in settings to the projects page', async () => {
    const { user } = await renderApp('/settings')

    await user.click(screen.getByRole('button', { name: 'Integrações' }))
    await user.click(screen.getByRole('link', { name: 'Abrir Projetos' }))

    expect(await screen.findByRole('button', { name: /novo projeto/i })).toBeInTheDocument()
  })

  describe('invite code', () => {
    it('shows the organization code to the admin and copies it', async () => {
      const { user } = await renderApp('/dashboard')

      await user.click(screen.getByRole('button', { name: /menu da conta/i }))
      expect(screen.getByText(testOrganization.join_code)).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Copiar código de convite' }))

      expect(await navigator.clipboard.readText()).toBe(testOrganization.join_code)
      expect(screen.getByRole('button', { name: 'Código copiado' })).toBeInTheDocument()
    })

    it('hides the code from members who are not admins', async () => {
      db.members[0].role = 'viewer'
      const { user } = await renderApp('/dashboard')

      await user.click(screen.getByRole('button', { name: /menu da conta/i }))

      expect(screen.queryByText(testOrganization.join_code)).not.toBeInTheDocument()
    })
  })

  describe('authentication', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    it('sends visitors without a session to the login page', async () => {
      renderWithRouter(<App />, { route: '/dashboard' })

      expect(await screen.findByRole('heading', { name: 'Bem-vindo de volta' })).toBeInTheDocument()
    })

    it('logs in and opens the dashboard', async () => {
      const { user } = renderWithRouter(<App />, { route: '/login' })

      await user.type(await screen.findByLabelText('E-mail'), testUser.email)
      await user.type(screen.getByLabelText('Senha'), testPassword)
      await user.click(screen.getByRole('button', { name: /entrar na plataforma/i }))

      expect(await screen.findByRole('complementary')).toBeInTheDocument()
    })

    it('asks for an organization when the user has none', async () => {
      db.members = []
      signInAs()
      renderWithRouter(<App />, { route: '/dashboard' })

      expect(
        await screen.findByRole('heading', { name: 'Onde você trabalha?' }),
      ).toBeInTheDocument()
    })

    it('signs out from the account menu', async () => {
      signInAs()
      const { user } = await renderApp('/dashboard')

      await user.click(screen.getByRole('button', { name: /menu da conta/i }))
      await user.click(screen.getByRole('button', { name: 'Sair' }))

      expect(await screen.findByRole('heading', { name: 'Bem-vindo de volta' })).toBeInTheDocument()
      expect(localStorage.getItem('govtech-auth')).toBeNull()
    })
  })
})
