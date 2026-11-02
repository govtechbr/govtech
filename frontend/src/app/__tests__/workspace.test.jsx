import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import App from '@/app/App'
import { db, otherOrganization, signInAs, testUser } from '@/test/msw/db'
import { renderWithRouter } from '@/test/renderWithRouter'

const orgBProject = 'Projeto da Org B'

function sidebar() {
  return screen.getByRole('complementary')
}

async function renderApp(route = '/projects') {
  const result = renderWithRouter(<App />, { route })

  await screen.findByRole('complementary')
  return result
}

async function switchTo(user, name) {
  await user.click(within(sidebar()).getByRole('button', { name: /trocar empresa/i }))
  await user.click(within(sidebar()).getByRole('button', { name: new RegExp(`${name}$`) }))
}

// Alice também é admin da Org B, que tem um projeto próprio
function joinOtherOrganization() {
  db.members.push({ organization_id: otherOrganization.id, user_id: testUser.id, role: 'admin' })
  db.projects.push({
    ...db.projects[0],
    id: '20000000-0000-0000-0000-0000000000b1',
    name: orgBProject,
    organization_id: otherOrganization.id,
  })
}

describe('Workspace (company) switch', () => {
  beforeEach(() => {
    signInAs()
  })

  it('shows only the projects of the chosen company', async () => {
    joinOtherOrganization()
    const { user } = await renderApp()

    expect(
      await screen.findByRole('heading', { name: 'Plataforma de Pagamentos' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: orgBProject })).not.toBeInTheDocument()

    await switchTo(user, 'Org B')

    expect(await screen.findByRole('heading', { name: orgBProject })).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Plataforma de Pagamentos' }),
    ).not.toBeInTheDocument()
    expect(
      within(sidebar()).getByRole('button', { name: 'Trocar empresa (atual: Org B)' }),
    ).toBeInTheDocument()
  })

  it('opens the last company used', async () => {
    joinOtherOrganization()
    const { user, unmount } = await renderApp()

    await switchTo(user, 'Org B')
    await screen.findByRole('heading', { name: orgBProject })
    unmount()

    await renderApp()

    expect(
      within(sidebar()).getByRole('button', { name: 'Trocar empresa (atual: Org B)' }),
    ).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: orgBProject })).toBeInTheDocument()
  })

  it('falls back to the first company when the saved one is gone', async () => {
    localStorage.setItem(
      'govtech:last-organization',
      JSON.stringify({ [testUser.id]: 'empresa-que-saiu' }),
    )
    await renderApp()

    expect(
      within(sidebar()).getByRole('button', { name: 'Trocar empresa (atual: Org A)' }),
    ).toBeInTheDocument()
  })

  it('creates the project in the chosen company', async () => {
    joinOtherOrganization()
    const { user } = await renderApp()

    await switchTo(user, 'Org B')
    await user.click(await screen.findByRole('button', { name: /novo projeto/i }))
    await user.type(screen.getByLabelText('Nome do Projeto'), 'Novo na Org B')
    await user.type(screen.getByLabelText('Objetivo do Projeto'), 'Teste')
    await user.click(screen.getByLabelText('Deadline'))
    await user.keyboard('{PageDown}{Enter}') // um mês depois de hoje
    await user.type(screen.getByLabelText('Responsável'), 'Dev')
    await user.click(screen.getByRole('button', { name: /criar projeto/i }))
    await screen.findByText('Projeto criado com sucesso.')

    expect(db.projects.find((project) => project.name === 'Novo na Org B')).toMatchObject({
      organization_id: otherOrganization.id,
    })
  })

  it('shows only the repositories of the chosen company', async () => {
    joinOtherOrganization()
    db.repositories.push({
      id: 'repo-b',
      organization_id: otherOrganization.id,
      github_id: 9,
      full_name: 'org-b/api',
      name: 'api',
      description: null,
      language: 'Go',
      default_branch: 'main',
      html_url: 'https://github.com/org-b/api',
      private: true,
      pushed_at: null,
    })
    db.projectRepositories.push({
      project_id: '20000000-0000-0000-0000-0000000000b1',
      repository_id: 'repo-b',
    })
    const { user } = await renderApp('/repositories')

    expect(
      await screen.findByRole('heading', { name: 'Nenhum repositório sincronizado' }),
    ).toBeInTheDocument()

    await switchTo(user, 'Org B')

    expect(await screen.findByRole('link', { name: 'org-b/api' })).toBeInTheDocument()
  })

  it('adds a company with a code and opens it', async () => {
    const { user } = await renderApp('/dashboard')

    await user.click(within(sidebar()).getByRole('button', { name: /trocar empresa/i }))
    await user.click(within(sidebar()).getByRole('button', { name: 'Adicionar empresa' }))

    expect(await screen.findByRole('link', { name: 'Voltar para o painel' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Entrar com código' }))
    await user.type(screen.getByLabelText('Código da organização'), otherOrganization.join_code)
    await user.click(screen.getByRole('button', { name: /entrar na organização/i }))

    expect(
      await within(await screen.findByRole('complementary')).findByRole('button', {
        name: 'Trocar empresa (atual: Org B)',
      }),
    ).toBeInTheDocument()
  })
})
