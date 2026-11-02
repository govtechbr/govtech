import { screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import App from '@/app/App'
import { colleague, db, signInAs, testOrganization, testUser } from '@/test/msw/db'
import { renderWithRouter } from '@/test/renderWithRouter'

const HOUR = 60 * 60 * 1000

let nextId = 1
function auditEvent(action, details = {}, overrides = {}) {
  return {
    id: nextId++,
    organization_id: testOrganization.id,
    actor_name: 'Alice Souza',
    actor_role: 'admin',
    action,
    entity_type: action.split('.')[0],
    entity_name: 'Portal',
    details,
    created_at: new Date(Date.now() - HOUR).toISOString(),
    ...overrides,
  }
}

function setRole(person, role) {
  db.members.find((member) => member.user_id === person.id).role = role
}

async function openAudit(person = testUser) {
  signInAs(person)
  const result = renderWithRouter(<App />, { route: '/audit' })
  await screen.findByRole('complementary')
  return result
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('audit trail', () => {
  it('lists real events with who did what and counts the period (rules AU1, AU2, AU5)', async () => {
    db.auditEvents = [
      auditEvent('project.updated', { progress: { from: 0, to: 40 } }),
      auditEvent(
        'member.role_changed',
        { from: 'developer', to: 'stakeholder' },
        { entity_name: 'Bruno Lima' },
      ),
      auditEvent(
        'github.sync_failed',
        { trigger: 'schedule', error: 'Chave do GitHub inválida ou expirada.' },
        { actor_name: 'Sistema', actor_role: null },
      ),
      // fora dos 30 dias
      auditEvent('project.created', {}, { created_at: '2020-01-01T00:00:00Z' }),
    ]
    await openAudit()

    const list = await screen.findByRole('list')
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(3)
    // do mais novo ao mais antigo
    expect(items[0]).toHaveTextContent(
      'Sincronização automática falhou: Chave do GitHub inválida ou expirada.',
    )
    expect(items[0]).toHaveTextContent('Sistema')
    expect(items[1]).toHaveTextContent('Mudou o papel de developer para stakeholder · Bruno Lima')
    expect(items[2]).toHaveTextContent('Alterou o projeto: progresso de 0% para 40% · Portal')
    expect(items[2]).toHaveTextContent('Alice Souza (admin)')

    const total = screen.getByText('Eventos registrados').closest('article')
    expect(await within(total).findByText('3')).toBeVisible()
    const access = screen.getByText('Mudanças de acesso').closest('article')
    expect(within(access).getByText('1')).toBeVisible()
    const failures = screen.getByText('Sincronizações com falha').closest('article')
    expect(within(failures).getByText('1')).toBeVisible()
  })

  it('shows the three KPIs and flags failed syncs only when there are any', async () => {
    db.auditEvents = [auditEvent('project.created'), auditEvent('member.joined')]
    const { unmount } = await openAudit()

    const total = await screen.findByRole('article', { name: 'Eventos registrados' })
    expect(await within(total).findByText('2')).toBeVisible()
    expect(within(total).getByText('Nos últimos 30 dias')).toBeVisible()
    const access = screen.getByRole('article', { name: 'Mudanças de acesso' })
    expect(within(access).getByText('1')).toBeVisible()
    const failures = screen.getByRole('article', { name: 'Sincronizações com falha' })
    expect(within(failures).getByText('0')).toBeVisible()
    expect(within(failures).queryByRole('img', { name: 'Requer atenção' })).not.toBeInTheDocument()
    unmount()

    db.auditEvents.push(auditEvent('github.sync_failed', { trigger: 'schedule' }))
    await openAudit()
    const failed = await screen.findByRole('article', { name: 'Sincronizações com falha' })
    expect(await within(failed).findByRole('img', { name: 'Requer atenção' })).toBeVisible()
    expect(within(failed).getByText('1')).toBeVisible()
  })

  it('filters by type and period', async () => {
    db.auditEvents = [
      auditEvent('project.created'),
      auditEvent('github.synced', { trigger: 'manual', repositoryCount: 1 }),
      auditEvent(
        'project.deleted',
        {},
        { created_at: new Date(Date.now() - 60 * 24 * HOUR).toISOString() },
      ),
    ]
    const { user } = await openAudit()
    await screen.findByRole('list')

    const types = screen.getByRole('group', { name: 'Tipo de evento' })
    await user.click(within(types).getByRole('button', { name: 'Projetos' }))
    expect(await screen.findByText('Criou o projeto')).toBeVisible()
    expect(screen.queryByText(/Sincronização manual/)).not.toBeInTheDocument()
    expect(screen.queryByText('Excluiu o projeto')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '90 dias' }))
    expect(await screen.findByText('Excluiu o projeto')).toBeVisible()
  })

  it('loads 50 events at a time', async () => {
    db.auditEvents = Array.from({ length: 55 }, () => auditEvent('project.created'))
    const { user } = await openAudit()

    const list = await screen.findByRole('list')
    expect(within(list).getAllByRole('listitem')).toHaveLength(50)

    await user.click(screen.getByRole('button', { name: 'Carregar mais' }))
    await expect.poll(() => within(list).getAllByRole('listitem').length).toBe(55)
    expect(screen.queryByRole('button', { name: 'Carregar mais' })).not.toBeInTheDocument()
  })

  it('exports the filtered events as CSV, safe from formulas (rule AU6)', async () => {
    db.auditEvents = [auditEvent('project.created', {}, { entity_name: '=HYPERLINK("x")' })]
    const created = []
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      created.push(blob)
      return 'blob:csv'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const { user } = await openAudit()
    await screen.findByRole('list')

    await user.click(screen.getByRole('button', { name: 'Exportar CSV' }))

    await expect.poll(() => click.mock.calls.length).toBe(1)
    const csv = await created[0].text()
    expect(csv).toContain('Data e hora;Quem;O que;Onde;Ação')
    expect(csv).toContain(
      'Alice Souza (admin);Criou o projeto;"\'=HYPERLINK(""x"")";project.created',
    )
  })

  it('is visible to the stakeholder, but not to the developer (rule AU4)', async () => {
    db.auditEvents = [auditEvent('project.created')]
    setRole(testUser, 'stakeholder')
    setRole(colleague, 'admin')
    const { unmount } = await openAudit()
    expect(await screen.findByText('Criou o projeto')).toBeVisible()
    unmount()

    setRole(testUser, 'developer')
    await openAudit()
    expect(
      await screen.findByText(/A auditoria é visível só para admin e stakeholder/),
    ).toBeVisible()
    expect(screen.queryByRole('button', { name: /Auditoria/ })).not.toBeInTheDocument()
  })
})
