import { supabase } from '@/shared/lib/supabase'

// Trilha de auditoria (docs/REGRAS_DE_NEGOCIO.md §7). Só leitura: os eventos são
// gravados pelo banco (triggers) e pela Edge Function `github`. O RLS só mostra
// a auditoria para admin e stakeholder (AU4); para os outros a lista vem vazia.

export const AUDIT_PAGE_SIZE = 50
const DAY = 24 * 60 * 60 * 1000

// Filtro de tipo (AU5): o prefixo da ação
export const AUDIT_TYPES = {
  project: 'Projetos',
  member: 'Membros',
  organization: 'Empresa',
  github: 'GitHub',
}

const columns = 'id, actor_name, actor_role, action, entity_type, entity_name, details, created_at'

function since(days, now) {
  return new Date(now.getTime() - days * DAY).toISOString()
}

function filtered(query, { organizationId, days, type, now }) {
  let result = query.eq('organization_id', organizationId).gte('created_at', since(days, now))
  if (type) result = result.like('action', `${type}.%`)
  return result
}

// 50 eventos por vez, do mais novo ao mais antigo; `before` = id do último já carregado
export async function listAuditEvents({
  organizationId,
  days,
  type,
  before,
  limit = AUDIT_PAGE_SIZE,
  now = new Date(),
}) {
  let query = filtered(supabase.from('audit_events').select(columns), {
    organizationId,
    days,
    type,
    now,
  })
  if (before) query = query.lt('id', before)

  const { data, error } = await query.order('id', { ascending: false }).limit(limit)

  if (error) throw new Error('Não foi possível carregar a auditoria. Tente de novo.')
  return data
}

// Todos os eventos dos filtros, para o CSV (AU6): páginas de 1.000 (o máximo do PostgREST)
const EXPORT_PAGE = 1000
const EXPORT_MAX = 10000

export async function listAllAuditEvents(filters) {
  const events = []
  let before = null

  while (events.length < EXPORT_MAX) {
    const page = await listAuditEvents({ ...filters, before, limit: EXPORT_PAGE })
    events.push(...page)
    if (page.length < EXPORT_PAGE) break
    before = page.at(-1).id
  }

  return events
}

async function countEvents(filters, narrow = (query) => query) {
  const { count, error } = await narrow(
    filtered(supabase.from('audit_events').select('id', { count: 'exact', head: true }), filters),
  )

  if (error) throw new Error('Não foi possível carregar a auditoria. Tente de novo.')
  return count ?? 0
}

// Números dos cartões (AU5), sempre do período inteiro, sem o filtro de tipo
export async function countAuditEvents({ organizationId, days, now = new Date() }) {
  const filters = { organizationId, days, now }
  const [total, accessChanges, failedSyncs] = await Promise.all([
    countEvents(filters),
    countEvents({ ...filters, type: 'member' }),
    countEvents(filters, (query) => query.eq('action', 'github.sync_failed')),
  ])

  return { total, accessChanges, failedSyncs }
}
