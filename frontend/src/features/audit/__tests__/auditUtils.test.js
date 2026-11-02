import { describe, expect, it } from 'vitest'

import { describeEvent, eventType } from '@/features/audit/utils/describeEvent'
import { csvCell, toCsv } from '@/features/audit/utils/toCsv'

function event(action, details = {}, overrides = {}) {
  return {
    id: 1,
    actor_name: 'Alice Souza',
    actor_role: 'admin',
    action,
    entity_type: 'project',
    entity_name: 'Portal',
    details,
    created_at: '2026-11-02T15:00:00Z',
    ...overrides,
  }
}

describe('describeEvent', () => {
  it('describes the strategic objectives events (rule S7)', () => {
    expect(describeEvent(event('objective.created')).what).toBe('Criou o objetivo estratégico')
    expect(describeEvent(event('objective.deleted')).what).toBe('Excluiu o objetivo estratégico')
    expect(describeEvent(event('objective.updated', { title: { from: 'A', to: 'B' } })).what).toBe(
      'Alterou o objetivo estratégico: título de "A" para "B"',
    )
    expect(eventType(event('objective.created'))).toBe('objective')
  })

  it('shows the objective link and the mission change (rule S7)', () => {
    expect(
      describeEvent(event('project.updated', { objective: { from: null, to: 'Crescer' } })).what,
    ).toBe('Alterou o projeto: objetivo estratégico de vazio para "Crescer"')
    expect(
      describeEvent(event('organization.strategy_updated', { mission: { from: '', to: 'X' } }))
        .what,
    ).toBe('Alterou a missão e a visão da empresa: missão alterada')
  })

  it('says who did what, and where (rules AU1, AU2)', () => {
    expect(describeEvent(event('project.created'))).toEqual({
      who: 'Alice Souza (admin)',
      what: 'Criou o projeto',
      target: 'Portal',
    })
  })

  it('lists the changed project fields with before and after', () => {
    const { what } = describeEvent(
      event('project.updated', {
        priority: { from: 'high', to: 'low' },
        progress: { from: 0, to: 40 },
        deadline: { from: null, to: '2026-12-20' },
        description: { from: 'a', to: 'b' },
      }),
    )

    expect(what).toBe(
      'Alterou o projeto: prioridade de alta para baixa; progresso de 0% para 40%; ' +
        'prazo de vazio para 20/12/2026; descrição alterada',
    )
  })

  it('describes member and company events', () => {
    expect(
      describeEvent(event('member.role_changed', { from: 'developer', to: 'stakeholder' })).what,
    ).toBe('Mudou o papel de developer para stakeholder')
    expect(describeEvent(event('organization.join_code_regenerated')).what).toBe(
      'Gerou um novo código de convite',
    )
  })

  it('summarizes a scheduled sync as the System, with partial data flagged', () => {
    const described = describeEvent(
      event(
        'github.synced',
        {
          trigger: 'schedule',
          repositoryCount: 1,
          pullRequestCount: 12,
          branchCount: 3,
          commitCount: 40,
          partial: true,
        },
        { actor_name: 'Sistema', actor_role: null },
      ),
    )

    expect(described.who).toBe('Sistema')
    expect(described.what).toBe(
      'Sincronização automática: 1 repositório, 12 PRs, 3 branches, 40 commits (dados parciais: limite atingido)',
    )
  })

  // G11: sincronizações novas contam também as execuções do CI
  it('counts the CI runs of a sync when the event has them', () => {
    const described = describeEvent(
      event('github.synced', {
        trigger: 'manual',
        repositoryCount: 1,
        pullRequestCount: 2,
        branchCount: 1,
        commitCount: 5,
        ciRunCount: 1,
        partial: false,
      }),
    )

    expect(described.what).toBe(
      'Sincronização manual: 1 repositório, 2 PRs, 1 branch, 5 commits, 1 execução do CI',
    )
  })

  it('shows the GitHub key only by its last 4 characters', () => {
    expect(
      describeEvent(event('github.connected', { githubLogin: 'dono-gh', tokenLast4: 'abcd' })).what,
    ).toBe('Conectou a chave do GitHub de dono-gh (final abcd)')
  })

  it('groups events by the action prefix', () => {
    expect(eventType(event('github.sync_failed'))).toBe('github')
  })
})

describe('toCsv (rule AU6)', () => {
  it('quotes separators and quotes, and starts with a BOM for Excel', () => {
    expect(toCsv(['a', 'b'], [['x;y', 'diz "oi"']])).toBe(
      String.fromCharCode(0xfeff) + 'a;b\r\n"x;y";"diz ""oi"""',
    )
  })

  it('neutralizes cells that Excel would run as formulas', () => {
    expect(csvCell('=HYPERLINK("http://mal")')).toBe('"\'=HYPERLINK(""http://mal"")"')
    expect(csvCell('+1')).toBe("'+1")
    expect(csvCell('-2')).toBe("'-2")
    expect(csvCell('@SUM(A1)')).toBe("'@SUM(A1)")
    expect(csvCell('Portal')).toBe('Portal')
    expect(csvCell(null)).toBe('')
  })
})
