import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from '@/app/App'
import { db, signInAs, testOrganization, testUser } from '@/test/msw/db'
import { renderWithRouter } from '@/test/renderWithRouter'

async function renderAs(person, route = '/strategy') {
  signInAs(person)
  const result = renderWithRouter(<App />, { route })

  await screen.findByRole('complementary')
  return result
}

function seedObjective(overrides = {}) {
  const objective = {
    id: '40000000-0000-0000-0000-00000000000a',
    organization_id: testOrganization.id,
    title: 'Reduzir o risco operacional',
    description: 'Menos falhas chegando à produção.',
    ...overrides,
  }

  db.objectives.push(objective)
  return objective
}

function makeStakeholder() {
  db.members.find((member) => member.user_id === testUser.id).role = 'stakeholder'
}

describe('Strategy page (rules S1–S7)', () => {
  it('lets the admin write the mission and vision (S1)', async () => {
    const { user } = await renderAs(testUser)

    await user.click(await screen.findByRole('button', { name: /editar missão e visão/i }))
    await user.type(screen.getByLabelText('Missão'), 'Entregar tecnologia pública confiável.')
    await user.type(screen.getByLabelText('Visão'), 'Ser referência em governança de TI.')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Entregar tecnologia pública confiável.')).toBeInTheDocument()
    expect(db.organizations[0].mission).toBe('Entregar tecnologia pública confiável.')
    expect(db.organizations[0].vision).toBe('Ser referência em governança de TI.')
  })

  it('lets the admin create an objective that starts without projects (S2, S4)', async () => {
    const { user } = await renderAs(testUser)

    await user.click(await screen.findByRole('button', { name: /novo objetivo/i }))
    await user.type(screen.getByLabelText('Título'), 'Ampliar a transparência')
    await user.click(screen.getByRole('button', { name: /criar objetivo/i }))

    const card = (await screen.findByRole('heading', { name: 'Ampliar a transparência' })).closest(
      'article',
    )
    expect(within(card).getByText('Sem projetos vinculados')).toBeInTheDocument()
    expect(db.objectives.map((objective) => objective.title)).toEqual(['Ampliar a transparência'])
  })

  it('shows the worst status of the linked projects and why (S4, S5)', async () => {
    const objective = seedObjective()
    // Prazo vencido gera alerta de Risco sem depender da data de hoje
    db.projects[0] = { ...db.projects[0], deadline: '2000-01-01', objective_id: objective.id }
    await renderAs(testUser)

    const card = (await screen.findByRole('heading', { name: objective.title })).closest('article')

    expect(await within(card).findByText('Risco')).toBeInTheDocument()
    expect(within(card).getByText(db.projects[0].name)).toBeInTheDocument()
    expect(within(card).getByText(/Prazo vencido/)).toBeInTheDocument()
  })

  it('shows a healthy objective when its project has no alert', async () => {
    const objective = seedObjective()
    db.projects[0] = { ...db.projects[0], deadline: '2099-01-01', objective_id: objective.id }
    await renderAs(testUser)

    const card = (await screen.findByRole('heading', { name: objective.title })).closest('article')

    expect(await within(card).findByText('Saudável')).toBeInTheDocument()
  })

  it('lets the admin delete an objective and keeps the project (S3)', async () => {
    const objective = seedObjective()
    db.projects[0] = { ...db.projects[0], objective_id: objective.id }
    const { user } = await renderAs(testUser)

    await user.click(
      await screen.findByRole('button', { name: `Excluir objetivo ${objective.title}` }),
    )
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: /excluir objetivo/i }),
    )

    await waitFor(() => expect(db.objectives).toHaveLength(0))
    expect(db.projects[0].objective_id).toBeNull()
    expect(db.projects).toHaveLength(4)
  })

  it('shows everything to a stakeholder but no edit controls (S1, S2)', async () => {
    seedObjective()
    db.organizations[0].mission = 'Missão já definida.'
    makeStakeholder()
    await renderAs(testUser)

    expect(await screen.findByText('Missão já definida.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Reduzir o risco operacional' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /novo objetivo/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /editar missão e visão/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /excluir objetivo/i })).toBeNull()
  })

  it('links a project to an objective in the project form (S3)', async () => {
    const objective = seedObjective()
    const { user } = await renderAs(testUser, '/projects')

    await user.click(await screen.findByRole('button', { name: /novo projeto/i }))
    await user.type(screen.getByLabelText('Nome do Projeto'), 'Projeto Estratégico')
    await user.type(screen.getByLabelText('Objetivo do Projeto'), 'Teste do vínculo')
    await user.click(screen.getByLabelText('Deadline'))
    await user.keyboard('{PageDown}{Enter}')
    await user.type(screen.getByLabelText('Responsável'), 'Dev')
    await user.click(screen.getByLabelText('Objetivo estratégico'))
    await user.click(screen.getByRole('option', { name: objective.title }))
    await user.click(screen.getByRole('button', { name: /criar projeto/i }))

    await screen.findByText('Projeto criado com sucesso.')
    expect(db.projects.at(-1).objective_id).toBe(objective.id)
    expect(
      within(
        (await screen.findByRole('heading', { name: 'Projeto Estratégico' })).closest('article'),
      ).getByText(objective.title),
    ).toBeInTheDocument()
  })
})
