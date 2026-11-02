import { formatIsoDay } from '@/shared/lib/date'

// Texto em pt-BR de um evento da auditoria (regras AU1 e AU2)

const ROLE_LABELS = { admin: 'admin', developer: 'developer', stakeholder: 'stakeholder' }
const PRIORITY_LABELS = { high: 'alta', medium: 'média', low: 'baixa' }
const FIELD_LABELS = {
  name: 'nome',
  description: 'descrição',
  deadline: 'prazo',
  owner: 'responsável',
  priority: 'prioridade',
  progress: 'progresso',
}

const role = (value) => ROLE_LABELS[value] ?? value
const plural = (count, singular, pluralForm) => `${count} ${count === 1 ? singular : pluralForm}`

function fieldValue(field, value) {
  if (value === null || value === undefined || value === '') return 'vazio'
  if (field === 'deadline') return formatIsoDay(value)
  if (field === 'priority') return PRIORITY_LABELS[value] ?? value
  if (field === 'progress') return `${value}%`
  if (field === 'description') return 'texto novo'
  return `"${value}"`
}

// "prioridade de alta para baixa; progresso de 0% para 40%"
function describeChanges(details) {
  return Object.entries(details)
    .filter(([field]) => FIELD_LABELS[field])
    .map(([field, { from, to }]) =>
      field === 'description'
        ? 'descrição alterada'
        : `${FIELD_LABELS[field]} de ${fieldValue(field, from)} para ${fieldValue(field, to)}`,
    )
    .join('; ')
}

function describeSync({
  trigger,
  repositoryCount,
  pullRequestCount,
  branchCount,
  commitCount,
  partial,
}) {
  const how = trigger === 'schedule' ? 'Sincronização automática' : 'Sincronização manual'
  const counts = [
    plural(repositoryCount ?? 0, 'repositório', 'repositórios'),
    plural(pullRequestCount ?? 0, 'PR', 'PRs'),
    plural(branchCount ?? 0, 'branch', 'branches'),
    plural(commitCount ?? 0, 'commit', 'commits'),
  ].join(', ')

  return `${how}: ${counts}${partial ? ' (dados parciais: limite atingido)' : ''}`
}

const describers = {
  'project.created': () => 'Criou o projeto',
  'project.updated': (event) => `Alterou o projeto: ${describeChanges(event.details)}`,
  'project.deleted': () => 'Excluiu o projeto',
  'member.joined': (event) => `Entrou na empresa como ${role(event.details.role)}`,
  'member.role_changed': (event) =>
    `Mudou o papel de ${role(event.details.from)} para ${role(event.details.to)}`,
  'member.removed': () => 'Removeu da empresa',
  'member.left': () => 'Saiu da empresa',
  'organization.renamed': (event) =>
    `Renomeou a empresa de "${event.details.from}" para "${event.details.to}"`,
  'organization.join_code_regenerated': () => 'Gerou um novo código de convite',
  'github.connected': (event) =>
    `Conectou a chave do GitHub de ${event.details.githubLogin} (final ${event.details.tokenLast4})`,
  'github.disconnected': () => 'Removeu a chave do GitHub',
  'github.repositories_selected': (event) => {
    const names = event.details.repositories ?? []
    return `Escolheu ${plural(names.length, 'repositório', 'repositórios')}: ${names.join(', ')}`
  },
  'github.synced': (event) => describeSync(event.details),
  'github.sync_failed': (event) =>
    `${event.details.trigger === 'schedule' ? 'Sincronização automática' : 'Sincronização manual'} falhou: ${event.details.error}`,
}

// { who, what, target }: "Ana Souza (admin)", "Alterou o projeto: …", "Portal"
export function describeEvent(event) {
  const describe = describers[event.action]

  return {
    who: event.actor_role ? `${event.actor_name} (${role(event.actor_role)})` : event.actor_name,
    what: describe ? describe(event) : event.action,
    target: event.entity_name ?? '',
  }
}

// Grupo do filtro de tipo e do ícone: project, member, organization ou github
export function eventType(event) {
  return event.action.split('.')[0]
}
