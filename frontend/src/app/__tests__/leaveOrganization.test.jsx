import { act, screen, within } from '@testing-library/react'
import { focusManager } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import App from '@/app/App'
import { colleague, db, otherOrganization, signInAs, testOrganization } from '@/test/msw/db'
import { renderWithRouter } from '@/test/renderWithRouter'

function joinOtherOrganization() {
  db.members.push({
    organization_id: otherOrganization.id,
    user_id: colleague.id,
    role: 'stakeholder',
  })
}

async function leave(user) {
  await user.click(await screen.findByRole('button', { name: 'Sair da organização' }))
  await user.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: /sair|remover/i }),
  )
  await screen.findByText('Você saiu da organização.')
}

// Um admin, em outro navegador, remove o colega da Org A
function removedByAdmin() {
  db.members = db.members.filter(
    (member) =>
      !(member.user_id === colleague.id && member.organization_id === testOrganization.id),
  )
}

// A pessoa volta para a aba do app
function returnToTab() {
  act(() => {
    focusManager.setFocused(false)
    focusManager.setFocused(true)
  })
}

// Espera a tela terminar de carregar antes de mudar o banco
async function openAccessPage() {
  renderWithRouter(<App />, { route: '/access' })
  await screen.findByRole('table')
}

// Busca na tela inteira: trocar de empresa remonta a barra lateral
async function currentOrganizationIs(name) {
  expect(
    await screen.findByRole('button', { name: `Trocar empresa (atual: ${name})` }),
  ).toBeInTheDocument()
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
    joinOtherOrganization()
    signInAs(colleague)
    const { user } = renderWithRouter(<App />, { route: '/access' })

    await leave(user)

    await currentOrganizationIs(otherOrganization.name)
    expect(db.organizations).toHaveLength(2)
  })

  it('sends a member removed by an admin to the organization page', async () => {
    signInAs(colleague)
    await openAccessPage()
    await currentOrganizationIs(testOrganization.name)

    removedByAdmin()
    returnToTab()

    expect(await screen.findByRole('heading', { name: 'Onde você trabalha?' })).toBeInTheDocument()
  })

  it('opens the other organization of a member removed from one of two', async () => {
    joinOtherOrganization()
    signInAs(colleague)
    await openAccessPage()
    await currentOrganizationIs(testOrganization.name)

    removedByAdmin()
    returnToTab()

    await currentOrganizationIs(otherOrganization.name)
  })
})
