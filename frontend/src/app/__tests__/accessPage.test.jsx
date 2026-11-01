import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from '@/app/App'
import { colleague, db, signInAs, testUser } from '@/test/msw/db'
import { renderWithRouter } from '@/test/renderWithRouter'

async function renderAs(user, route = '/access') {
  signInAs(user)
  const result = renderWithRouter(<App />, { route })

  await screen.findByRole('complementary')
  return result
}

// Busca só na tabela: o nome de quem está logado também aparece na barra lateral
async function memberRow(name) {
  const table = await screen.findByRole('table')

  return within(table).getByText(name, { exact: false, selector: 'b' }).closest('tr')
}

function roleOf(userId) {
  return db.members.find((member) => member.user_id === userId).role
}

describe('Access page (members)', () => {
  it('lists the real members with e-mail and role', async () => {
    await renderAs(testUser)

    const row = await memberRow('Bruno Lima')

    expect(within(row).getByText(colleague.email)).toBeInTheDocument()
    expect(within(row).getByRole('combobox', { name: 'Papel de Bruno Lima' })).toHaveValue(
      'developer',
    )
    expect(within(await memberRow('Alice Souza')).getByText('(você)')).toBeInTheDocument()
  })

  it('lets the admin change a member role', async () => {
    const { user } = await renderAs(testUser)

    await user.selectOptions(within(await memberRow('Bruno Lima')).getByRole('combobox'), 'viewer')

    expect(await screen.findByText('Bruno Lima agora é Viewer.')).toBeInTheDocument()
    expect(roleOf(colleague.id)).toBe('viewer')
  })

  it('keeps the last admin and explains why', async () => {
    const { user } = await renderAs(testUser)

    await user.selectOptions(within(await memberRow('Alice Souza')).getByRole('combobox'), 'viewer')

    expect(
      await screen.findByText('A organização precisa de pelo menos um administrador.'),
    ).toBeInTheDocument()
    expect(roleOf(testUser.id)).toBe('admin')
  })

  it('removes a member after confirmation', async () => {
    const { user } = await renderAs(testUser)

    await user.click(await screen.findByRole('button', { name: 'Remover Bruno Lima' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remover' }))

    expect(await screen.findByText('Bruno Lima foi removido da organização.')).toBeInTheDocument()
    expect(screen.queryByText('Bruno Lima', { selector: 'b' })).not.toBeInTheDocument()
  })

  it('shows and regenerates the invite code', async () => {
    const { user } = await renderAs(testUser)

    await user.click(await screen.findByRole('button', { name: 'Convidar' }))
    const dialog = screen.getByRole('dialog', { name: 'Convidar para a organização' })
    expect(within(dialog).getByText('CODEA00001')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Gerar novo código' }))

    expect(await within(dialog).findByText('NOVOCOD001')).toBeInTheDocument()
  })

  it('shows members read-only to non-admins, who can only leave', async () => {
    await renderAs(colleague)

    await memberRow('Alice Souza')

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Convidar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Remover/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sair da organização' })).toBeInTheDocument()
  })

  it('opens a role with its real permissions and closes with Esc', async () => {
    const { user } = await renderAs(testUser)

    await user.click(await screen.findByRole('button', { name: /^Developer/ }))
    const dialog = screen.getByRole('dialog', { name: 'Developer' })
    expect(within(dialog).getByText('Criar e editar projetos')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('Project actions by role', () => {
  it('hides create, edit and delete from viewers', async () => {
    db.members.find((member) => member.user_id === colleague.id).role = 'viewer'
    const { user } = await renderAs(colleague, '/projects')

    await user.click(await screen.findByRole('button', { name: 'Plataforma de Pagamentos' }))
    expect(screen.getByRole('dialog', { name: 'Plataforma de Pagamentos' })).toBeInTheDocument()

    expect(screen.queryByRole('button', { name: /novo projeto/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /excluir/i })).not.toBeInTheDocument()
  })

  it('lets developers create and edit, but not delete', async () => {
    const { user } = await renderAs(colleague, '/projects')

    await user.click(await screen.findByRole('button', { name: 'Plataforma de Pagamentos' }))
    expect(screen.getByRole('dialog', { name: 'Plataforma de Pagamentos' })).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /novo projeto/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /excluir/i })).not.toBeInTheDocument()
  })
})
