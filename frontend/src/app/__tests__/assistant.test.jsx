import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from '@/app/App'
import { db, signInAs, testOrganization, testUser } from '@/test/msw/db'
import { renderWithRouter } from '@/test/renderWithRouter'

async function openAssistant() {
  signInAs(testUser)
  const { user } = renderWithRouter(<App />, { route: '/dashboard' })

  await user.click(await screen.findByRole('button', { name: /assistente com ia/i }))
  return { user, dialog: screen.getByRole('dialog', { name: 'Assistente de Governança' }) }
}

// Os dados da empresa chegam e as sugestões ficam disponíveis
async function suggestion(dialog, name) {
  const button = within(dialog).getByRole('button', { name })
  await expect.poll(() => button.disabled).toBe(false)
  return button
}

describe('AI governance assistant', () => {
  it('answers a suggested question with the company data, without logins (rules IA1, IA2)', async () => {
    db.repositories = [
      {
        id: 'repo-1',
        organization_id: testOrganization.id,
        github_id: 1,
        full_name: 'dono-gh/govtech',
        name: 'govtech',
        default_branch: 'main',
        html_url: 'https://github.com/dono-gh/govtech',
        private: true,
      },
    ]
    db.projectRepositories = [{ project_id: db.projects[0].id, repository_id: 'repo-1' }]
    db.pullRequests = [
      {
        id: 'pr-1',
        repository_id: 'repo-1',
        organization_id: testOrganization.id,
        number: 12,
        title: 'Ajusta o login',
        state: 'open',
        draft: false,
        author_login: 'dono-gh',
        author_avatar_url: 'https://avatars.example/dono-gh',
        approval_count: 0,
        html_url: 'https://github.com/dono-gh/govtech/pull/12',
        created_at_github: new Date().toISOString(),
        merged_at: null,
        closed_at: null,
      },
    ]
    const { user, dialog } = await openAssistant()

    expect(within(dialog).getByText(/respostas geradas por ia \(groq, nos eua\)/i)).toBeVisible()

    await user.click(await suggestion(dialog, 'Quais PRs precisam de atenção?'))

    const log = within(dialog).getByRole('log', { name: 'Conversa' })
    expect(
      await within(log).findByText('Resposta simulada para: Quais PRs precisam de atenção?'),
    ).toBeVisible()
    expect(within(dialog).getByText('Restam 19 perguntas hoje.')).toBeVisible()

    const [request] = db.assistantRequests
    expect(request.organizationId).toBe(testOrganization.id)
    expect(request.messages).toEqual([{ role: 'user', content: 'Quais PRs precisam de atenção?' }])
    expect(request.context.organization).toBe('Org A')
    expect(request.context.projects.length).toBe(db.projects.length)
    expect(request.context.pullRequests).toEqual([
      expect.objectContaining({ number: 12, repository: 'govtech', title: 'Ajusta o login' }),
    ])
    expect(JSON.stringify(request.context)).not.toMatch(/avatar|author_login|"dono-gh"/)
  })

  it('sends the earlier messages with a typed follow-up', async () => {
    const { user, dialog } = await openAssistant()
    await user.click(await suggestion(dialog, 'O que fazer para subir o índice?'))
    await within(dialog).findByText(/Resposta simulada para: O que fazer/)

    await user.type(within(dialog).getByLabelText('Sua pergunta'), 'E no projeto Portal?{Enter}')

    await within(dialog).findByText('Resposta simulada para: E no projeto Portal?')
    expect(db.assistantRequests[1].messages.map(({ role }) => role)).toEqual([
      'user',
      'assistant',
      'user',
    ])
  })

  it('shows the daily limit message (rule IA3)', async () => {
    db.assistantRemaining = 0
    const { user, dialog } = await openAssistant()

    await user.click(await suggestion(dialog, 'Resuma a governança para a diretoria.'))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Limite de perguntas de hoje atingido',
    )
  })

  it('closes with Escape and forgets the conversation (rule IA4)', async () => {
    const { user, dialog } = await openAssistant()
    await user.click(await suggestion(dialog, 'Quais PRs precisam de atenção?'))
    await within(dialog).findByText(/Resposta simulada/)

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /assistente com ia/i }))
    expect(screen.queryByText(/Resposta simulada/)).not.toBeInTheDocument()
  })
})
