import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from '@/app/App'
import { db, otherOrganization, signInAs, testUser } from '@/test/msw/db'
import { renderWithRouter } from '@/test/renderWithRouter'

// As telas de acesso dependem de rotas, sessão e cache: o teste usa o App inteiro

describe('LoginPage', () => {
  it('validates the fields before calling the server', async () => {
    const { user } = renderWithRouter(<App />, { route: '/login' })

    await user.click(await screen.findByRole('button', { name: /entrar na plataforma/i }))

    expect(screen.getByLabelText('E-mail')).toHaveAccessibleDescription('Informe um e-mail válido.')
    expect(screen.getByLabelText('Senha')).toHaveAccessibleDescription('Informe a senha.')
  })

  it('shows a friendly message for a wrong password', async () => {
    const { user } = renderWithRouter(<App />, { route: '/login' })

    await user.type(await screen.findByLabelText('E-mail'), testUser.email)
    await user.type(screen.getByLabelText('Senha'), 'senha-errada')
    await user.click(screen.getByRole('button', { name: /entrar na plataforma/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.')
  })

  it('toggles the password visibility', async () => {
    const { user } = renderWithRouter(<App />, { route: '/login' })

    await user.click(await screen.findByRole('button', { name: 'Mostrar senha' }))

    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text')
  })
})

describe('SignupPage', () => {
  async function fillSignup(user, { email = 'novo@test.local', password = '12345678' } = {}) {
    await user.type(await screen.findByLabelText('Nome completo'), 'Nova Pessoa')
    await user.type(screen.getByLabelText('E-mail'), email)
    await user.type(screen.getByLabelText('Senha'), password)
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))
  }

  it('asks to confirm the e-mail after signing up', async () => {
    const { user } = renderWithRouter(<App />, { route: '/cadastro' })

    await fillSignup(user)

    expect(await screen.findByText(/enviamos um link de confirmação/i)).toHaveTextContent(
      'Enviamos um link de confirmação para novo@test.local',
    )
  })

  it('rejects a short password', async () => {
    const { user } = renderWithRouter(<App />, { route: '/cadastro' })

    await fillSignup(user, { password: '123' })

    expect(screen.getByLabelText('Senha')).toHaveAccessibleDescription(
      'A senha precisa de pelo menos 8 caracteres.',
    )
  })

  it('tells when the e-mail is already registered', async () => {
    const { user } = renderWithRouter(<App />, { route: '/cadastro' })

    await fillSignup(user, { email: testUser.email })

    expect(await screen.findByRole('alert')).toHaveTextContent('Este e-mail já tem cadastro.')
  })
})

describe('OrganizationPage', () => {
  function renderWithoutOrganization() {
    db.members = []
    signInAs()
    return renderWithRouter(<App />, { route: '/organizacao' })
  }

  it('creates an organization and opens the dashboard', async () => {
    const { user } = renderWithoutOrganization()

    await user.type(await screen.findByLabelText('Nome da empresa'), 'Prefeitura Digital')
    await user.click(screen.getByRole('button', { name: 'Criar e continuar' }))

    expect(await screen.findByRole('complementary')).toBeInTheDocument()
    expect(db.members).toContainEqual(expect.objectContaining({ role: 'admin' }))
  })

  it('joins an organization with a valid code, in any case', async () => {
    const { user } = renderWithoutOrganization()

    await user.click(await screen.findByRole('button', { name: 'Entrar com código' }))
    await user.type(screen.getByLabelText('Código da organização'), 'codeb00001')
    await user.click(screen.getByRole('button', { name: 'Entrar na organização' }))

    expect(await screen.findByRole('complementary')).toBeInTheDocument()
    expect(db.members).toContainEqual(
      expect.objectContaining({ organization_id: otherOrganization.id, role: 'viewer' }),
    )
  })

  it('shows an error for an invalid code', async () => {
    const { user } = renderWithoutOrganization()

    await user.click(await screen.findByRole('button', { name: 'Entrar com código' }))
    await user.type(screen.getByLabelText('Código da organização'), 'ERRADO')
    await user.click(screen.getByRole('button', { name: 'Entrar na organização' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Código de organização inválido.')
  })
})
