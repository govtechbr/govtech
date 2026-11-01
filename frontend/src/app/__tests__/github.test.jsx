import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from '@/app/App'
import { colleague, db, githubAvailable, signInAs, testUser, validGitHubToken } from '@/test/msw/db'
import { renderWithRouter } from '@/test/renderWithRouter'

const [privateRepo, publicRepo] = githubAvailable

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

// Projeto (pelo índice) já conectado ao GitHub
function connect(projectIndex = 0) {
  db.githubCredentials.push({
    project_id: db.projects[projectIndex].id,
    token_last4: 'abcd',
    github_login: 'dono-gh',
    last_synced_at: null,
  })
}

// Repositório guardado uma vez e ligado aos projetos indicados
function linkRepository(repo, ...projectIndexes) {
  const id = `repo-${repo.id}`

  db.repositories.push({
    id,
    github_id: repo.id,
    full_name: repo.full_name,
    name: repo.name,
    description: repo.description,
    language: 'JavaScript',
    default_branch: 'main',
    html_url: `https://github.com/${repo.full_name}`,
    private: repo.private,
    pushed_at: null,
  })
  for (const index of projectIndexes) {
    db.projectRepositories.push({ project_id: db.projects[index].id, repository_id: id })
  }
}

async function connectWithToken(user, dialog) {
  await user.type(await within(dialog).findByLabelText(/chave do github/i), validGitHubToken)
  await user.click(within(dialog).getByRole('button', { name: 'Conectar' }))
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

  it('asks the admin to pick the repositories right after connecting', async () => {
    const { user } = await renderAs(testUser)
    const dialog = await openProject(user)

    await connectWithToken(user, dialog)

    const picker = await within(dialog).findByRole('group', {
      name: 'Repositórios deste projeto',
    })
    expect(
      within(picker).getByRole('checkbox', { name: /dono-gh\/govtech.*Privado/ }),
    ).not.toBeChecked()
    expect(
      within(picker).getByRole('checkbox', { name: /dono-gh\/blog.*Público/ }),
    ).not.toBeChecked()

    await user.click(within(picker).getByRole('checkbox', { name: /dono-gh\/govtech/ }))
    await user.click(within(dialog).getByRole('button', { name: 'Salvar (1)' }))

    expect(await screen.findByText(/salvos e sincronizados: 1 repositório/)).toBeInTheDocument()
    expect(
      await within(dialog).findByRole('link', { name: privateRepo.full_name }),
    ).toBeInTheDocument()
    expect(
      within(dialog).queryByRole('link', { name: publicRepo.full_name }),
    ).not.toBeInTheDocument()
  })

  it('requires at least one repository', async () => {
    const { user } = await renderAs(testUser)
    const dialog = await openProject(user)

    await connectWithToken(user, dialog)
    await user.click(await within(dialog).findByRole('button', { name: 'Salvar (0)' }))

    expect(within(dialog).getByRole('alert')).toHaveTextContent('Marque ao menos um repositório.')
  })

  it('changes the selection later and drops the unselected repository', async () => {
    connect()
    linkRepository(privateRepo, 0)
    const { user } = await renderAs(testUser)
    const dialog = await openProject(user)

    await user.click(await within(dialog).findByRole('button', { name: 'Escolher repositórios' }))
    const govtech = await within(dialog).findByRole('checkbox', { name: /dono-gh\/govtech/ })
    expect(govtech).toBeChecked()

    await user.click(govtech)
    await user.click(within(dialog).getByRole('checkbox', { name: /dono-gh\/blog/ }))
    await user.click(within(dialog).getByRole('button', { name: 'Salvar (1)' }))

    expect(
      await within(dialog).findByRole('link', { name: publicRepo.full_name }),
    ).toBeInTheDocument()
    expect(db.repositories.map((repository) => repository.full_name)).toEqual([
      publicRepo.full_name,
    ])
  })

  it('removes the connection after confirmation', async () => {
    connect()
    linkRepository(privateRepo, 0)
    const { user } = await renderAs(testUser)
    const dialog = await openProject(user)

    await user.click(await within(dialog).findByRole('button', { name: 'Remover' }))
    await user.click(within(dialog).getByRole('button', { name: 'Remover conexão' }))

    expect(
      await within(dialog).findByText('Nenhuma chave do GitHub conectada.'),
    ).toBeInTheDocument()
    expect(db.githubCredentials).toHaveLength(0)
    expect(db.repositories).toHaveLength(0)
  })

  it('lets developers sync but not pick repositories or change the token', async () => {
    connect()
    linkRepository(privateRepo, 0)
    const { user } = await renderAs(colleague)
    const dialog = await openProject(user)

    await user.click(await within(dialog).findByRole('button', { name: 'Sincronizar' }))

    expect(await screen.findByText(/Sincronizado: 1 repositório/)).toBeInTheDocument()
    expect(
      within(dialog).queryByRole('button', { name: 'Escolher repositórios' }),
    ).not.toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: 'Trocar chave' })).not.toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: 'Remover' })).not.toBeInTheDocument()
  })

  it('tells developers when the admin has not picked repositories yet', async () => {
    connect()
    const { user } = await renderAs(colleague)
    const dialog = await openProject(user)

    expect(await within(dialog).findByText(/admin ainda não escolheu/)).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: 'Sincronizar' })).not.toBeInTheDocument()
  })

  it('asks stakeholders to talk to the admin', async () => {
    setRole(colleague, 'stakeholder')
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
    connect()
    linkRepository(privateRepo, 0)
    const { user } = await renderAs(testUser)
    const dialog = await openProject(user)
    await user.click(await within(dialog).findByRole('button', { name: 'Sincronizar' }))
    await screen.findByText(/Sincronizado/)
    await user.keyboard('{Escape}')

    await user.click(screen.getByRole('button', { name: 'Repositórios' }))

    const table = await screen.findByRole('table')
    expect(within(table).getByRole('link', { name: privateRepo.full_name })).toBeInTheDocument()
    expect(within(table).getByText('Plataforma de Pagamentos')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Pull Requests' }))
    expect(
      await screen.findByRole('link', { name: '#12 — Integração com o GitHub (govtech)' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Branches' }))
    expect(await screen.findByText('main (padrão)')).toBeInTheDocument()
    expect(screen.getByText('abc1234')).toBeInTheDocument()
  })

  it('counts a repository shared by two projects only once', async () => {
    linkRepository(privateRepo, 0, 1)
    db.pullRequests.push({
      id: 'pr-shared',
      repository_id: `repo-${privateRepo.id}`,
      number: 3,
      title: 'Compartilhado',
      state: 'open',
      draft: false,
      author_login: 'dono-gh',
      html_url: 'https://github.com/dono-gh/govtech/pull/3',
      created_at_github: new Date().toISOString(),
      merged_at: null,
    })
    const { user } = await renderAs(testUser, '/repositories')

    const table = await screen.findByRole('table')
    expect(within(table).getAllByRole('link', { name: privateRepo.full_name })).toHaveLength(1)
    expect(
      within(table).getByText('Plataforma de Pagamentos, Sistema de Notificações'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Pull Requests' }))
    expect(await screen.findAllByRole('link', { name: '#3 — Compartilhado' })).toHaveLength(1)
  })

  it('filters by project', async () => {
    linkRepository(publicRepo, 1)
    const { user } = await renderAs(testUser, '/repositories')

    expect(await screen.findByRole('link', { name: publicRepo.full_name })).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Projeto'), 'Plataforma de Pagamentos')

    expect(
      await screen.findByRole('heading', { name: 'Nenhum repositório sincronizado' }),
    ).toBeInTheDocument()
  })
})
