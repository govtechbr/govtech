import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from '@/app/App'
import { db, signInAs, testUser } from '@/test/msw/db'
import { renderWithRouter } from '@/test/renderWithRouter'

async function renderProcesses() {
  signInAs(testUser)
  renderWithRouter(<App />, { route: '/processes' })

  await screen.findByRole('complementary')
}

function seedScore(components) {
  db.governanceScores.push({
    project_id: db.projects[0].id,
    organization_id: db.projects[0].organization_id,
    day: new Date().toISOString().slice(0, 10),
    score: 60,
    components,
    reconstructed: false,
    computed_at: new Date().toISOString(),
  })
}

const areaCard = async (name) => (await screen.findByRole('heading', { name })).closest('article')

describe('Processes page (rules C1–C5)', () => {
  it('shows the score of each area from the index criteria (C1, C3)', async () => {
    seedScore({ review: 50, flow: 100, deadline: 50, protection: 0, leadTime: null })
    await renderProcesses()

    const verification = await areaCard('Verificação (VER)')
    expect(await within(verification).findByText('/100')).toBeInTheDocument()
    expect(within(verification).getByText('/100').closest('p')).toHaveTextContent('50/100')

    const config = await areaCard('Gestão de Configuração (CM)')
    expect(within(config).getByText('/100').closest('p')).toHaveTextContent('0/100')

    const monitoring = await areaCard('Monitoramento e Controle do Projeto (PMC)')
    expect(within(monitoring).getByText('/100').closest('p')).toHaveTextContent('75/100')
    expect(within(monitoring).getByText('Fluxo de PRs')).toBeInTheDocument()
    expect(within(monitoring).getByText('Prazo')).toBeInTheDocument()
  })

  it('says "sem dados" instead of zero when there is no evidence (C3)', async () => {
    seedScore({ review: 50, flow: 100, deadline: 50, protection: 0, leadTime: null })
    await renderProcesses()

    const measurement = await areaCard('Medição e Análise (MA)')

    expect(await within(measurement).findByText('Sem dados')).toBeInTheDocument()
    expect(within(measurement).queryByText('/100')).toBeNull()
  })

  it('explains the practice and where the evidence comes from (C4)', async () => {
    await renderProcesses()

    const verification = await areaCard('Verificação (VER)')

    expect(within(verification).getByText(/revisão por pares/i)).toBeInTheDocument()
    expect(within(verification).getByText(/aprovações registradas/i)).toBeInTheDocument()
  })

  it('warns that this is supporting evidence, not a maturity assessment (C5)', async () => {
    await renderProcesses()

    expect(await screen.findByText(/não é uma avaliação formal de maturidade/i)).toBeInTheDocument()
  })

  it('is visible to every role, including stakeholders (C1)', async () => {
    db.members.find((member) => member.user_id === testUser.id).role = 'stakeholder'
    await renderProcesses()

    expect(await areaCard('Verificação (VER)')).toBeInTheDocument()
  })
})
