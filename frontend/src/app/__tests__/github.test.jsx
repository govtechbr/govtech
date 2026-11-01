import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from '@/app/App'
import { colleague, db, signInAs, testUser, validGitHubToken } from '@/test/msw/db'
import { renderWithRouter } from '@/test/renderWithRouter'

async function openProject(user, name = 'Plataforma de Pagamentos') {
  await user.click(await screen.findByRole('button', { name }))

  return screen.getByRole('dialog', { name })
}

async function renderAs(person, route = '/projects') {
  signInAs(person)
  const result = renderWithRouter(<App />, { route })

  await screen.findByRole('complementary')
  return result
}

function setRole(person, role) {
  db.members.find((member) => member.user_id === person.id).role = role
}

describe('GitHub connection (project detail)', () => {
  it('rejects an invalid token with the message from the server', async () => {
    const { user } = await renderAs(testUser)
    const dialog = await openProject(user)

    await user.type(
      await within(dialog).findByLabelText(/chave do github/i),
      'github_pat_errada_0000000000',
    )
    await user.click(within(dialog).getByRole('button', { name: 'Conectar' }))

    expect(await within(dialog).findByText(/inválida ou expirada/)).toBeInTheDocument()
  })

  it('validates a pasted token that is too short', async () => {
    const { user } = await renderAs(testUser)
    const dialog = await openProject(user)

    await user.type(await within(dialog).findByLabelText(/chave do github/i), 'curta')
    await user.click(within(dialog).getByRole('button', { name: 'Conectar' }))

    expect(within(dialog).getByLabelText(/chave do github/i)).toHaveAccessibleDescription(
      'Cole a chave completa do GitHub.',
    )
  })

  it('connects, syncs and shows the repositories of the project', async () => {
    const { user } = await renderAs(testUser)
    const dialog = await openProject(user)

    await user.type(await within(dialog).findByLabelText(/chave do github/i), validGitHubToken)
    await user.click(within(dialog).getByRole('button', { name: 'Conectar' }))

    expect(await within(dialog).findByText(/••••abcd/)).toBeInTheDocument()
    expect(within(dialog).getByText('dono-gh')).toBeInTheDocument()
    expect(within(dialog).getByText(/ainda não sincronizado/)).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Sincronizar' }))

    expect(await screen.findByText(/Sincronizado: 1 repositório/)).toBeInTheDocument()
    expect(await within(dialog).findByRole('link', { name: 'dono-gh/govtech' })).toBeInTheDocument()
  })

  it('removes the connection after confirmation', async () => {
    const { user } = await renderAs(testUser)
    const dialog = await openProject(user)

    await user.type(await within(dialog).findByLabelText(/chave do github/i), validGitHubToken)
    await user.click(within(dialog).getByRole('button', { name: 'Conectar' }))
    await user.click(await within(dialog).findByRole('button', { name: 'Remover' }))
    await user.click(within(dialog).getByRole('button', { name: 'Remover conexão' }))

    expect(
      await within(dialog).findByText('Nenhuma chave do GitHub conectada.'),
    ).toBeInTheDocument()
    expect(db.githubCredentials).toHaveLength(0)
  })

  it('lets developers sync but not change the token', async () => {
    db.githubCredentials = [
      {
        project_id: db.projects[0].id,
        token_last4: 'abcd',
        github_login: 'dono-gh',
        last_synced_at: null,
      },
    ]
    const { user } = await renderAs(colleague)
    const dialog = await openProject(user)

    expect(await within(dialog).findByRole('button', { name: 'Sincronizar' })).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: 'Trocar chave' })).not.toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: 'Remover' })).not.toBeInTheDocument()
  })

  it('asks viewers to talk to the admin', async () => {
    setRole(colleague, 'viewer')
    const { user } = await renderAs(colleague)
    const dialog = await openProject(user)

    expect(await within(dialog).findByText(/Peça ao admin/)).toBeInTheDocument()
    expect(within(dialog).queryByLabelText(/chave do github/i)).not.toBeInTheDocument()
  })
})

describe('Repositories page', () => {
  it('explains what to do when nothing is synced', async () => {
    await renderAs(testUser, '/repositories')

    expect(
      await screen.findByRole('heading', { name: 'Nenhum repositório sincronizado' }),
    ).toBeInTheDocument()
  })

  it('shows synced repositories, pull requests and branches', async () => {
    const projectId = db.projects[0].id
    db.githubCredentials = [
      { project_id: projectId, token_last4: 'abcd', github_login: 'dono-gh', last_synced_at: null },
    ]
    const { user } = await renderAs(testUser)
    const dialog = await openProject(user)
    await user.click(await within(dialog).findByRole('button', { name: 'Sincronizar' }))
    await screen.findByText(/Sincronizado/)
    await user.keyboard('{Escape}')

    await user.click(screen.getByRole('button', { name: 'Repositórios' }))

    const table = await screen.findByRole('table')
    expect(within(table).getByRole('link', { name: 'dono-gh/govtech' })).toBeInTheDocument()
    expect(within(table).getByText('Plataforma de Pagamentos')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Pull Requests' }))
    expect(
      await screen.findByRole('link', { name: '#12 — Integração com o GitHub' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Branches' }))
    expect(await screen.findByText('main (padrão)')).toBeInTheDocument()
    expect(screen.getByText('abc1234')).toBeInTheDocument()
  })

  it('filters by project', async () => {
    db.repositories = [
      {
        id: 'r1',
        project_id: db.projects[1].id,
        full_name: 'dono-gh/outro',
        name: 'outro',
        html_url: 'https://github.com/dono-gh/outro',
        private: false,
        pushed_at: null,
      },
    ]
    const { user } = await renderAs(testUser, '/repositories')

    expect(await screen.findByRole('link', { name: 'dono-gh/outro' })).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Projeto'), 'Plataforma de Pagamentos')

    expect(
      await screen.findByRole('heading', { name: 'Nenhum repositório sincronizado' }),
    ).toBeInTheDocument()
  })
})
