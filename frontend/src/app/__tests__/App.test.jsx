import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from '../App'
import { renderWithRouter } from '../../test/renderWithRouter'

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
})
