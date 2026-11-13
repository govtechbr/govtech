import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from '@/app/App'
import { colleague, db, otherOrganization, signInAs, testOrganization } from '@/test/msw/db'
import { renderWithRouter } from '@/test/renderWithRouter'

async function leave(user) {
  await user.click(await screen.findByRole('button', { name: 'Sair da organização' }))
  await user.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: /sair|remover/i }),
  )
}

describe('Leaving or losing an organization', () => {
  it('sends a member without other organizations to the organization page', async () => {
    signInAs(colleague)
    const { user } = renderWithRouter(<App />, { route: '/access' })

    await leave(user)

    expect(await screen.findByRole('heading', { name: 'Onde você trabalha?' })).toBeInTheDocument()
    expect(db.organizations).toHaveLength(2)
  })

  it('opens the other organization of a member who leaves one of two', async () => {
    db.members.push({
      organization_id: otherOrganization.id,
      user_id: colleague.id,
      role: 'stakeholder',
    })
    signInAs(colleague)
    const { user } = renderWithRouter(<App />, { route: '/access' })

    await leave(user)
    await screen.findByText('Você saiu da organização.')

    const sidebar = await screen.findByRole('complementary')
    expect(
      await within(sidebar).findByRole('button', {
        name: `Trocar empresa (atual: ${otherOrganization.name})`,
      }),
    ).toBeInTheDocument()
    expect(db.organizations).toHaveLength(2)
  })

  // Bug conhecido: a lista de empresas não é buscada de novo, então quem é removido
  // por um admin continua na empresa até recarregar. Vira `it` quando a correção entrar.
  it.fails('notices a removal made by an admin elsewhere', async () => {
    signInAs(colleague)
    const { user } = renderWithRouter(<App />, { route: '/access' })
    await screen.findByRole('button', { name: 'Sair da organização' })

    db.members = db.members.filter(
      (m) => !(m.user_id === colleague.id && m.organization_id === testOrganization.id),
    )
    await user.click(
      within(screen.getByRole('complementary')).getByRole('button', { name: /^projetos$/i }),
    )

    expect(await screen.findByRole('heading', { name: 'Onde você trabalha?' })).toBeInTheDocument()
  })
})
