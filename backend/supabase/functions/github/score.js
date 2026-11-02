// Índice de Governança (docs/REGRAS_DE_NEGOCIO.md §5.1, I1–I6). Funções puras:
// sem rede nem banco, para testar com `node --test`.
//
// O estado de cada PR num instante `now` sai das datas (criado, mergeado,
// fechado), e é isso que permite recalcular dias passados (I6). Rascunho,
// proteção da branch e prazo são os de hoje.
//
// Os limites são os mesmos dos alertas da tela (frontend/src/shared/lib/governance.js).

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

const WINDOW_DAYS = 30
const OPEN_WARNING_DAYS = 1
const OPEN_DANGER_DAYS = 3
const DEADLINE_WARNING_DAYS = 7
const LEAD_TIME_BEST_HOURS = 24
const LEAD_TIME_WORST_HOURS = 7 * 24

// Fuso de MS (America/Campo_Grande): UTC−4 fixo, sem horário de verão desde 2019
const MS_OFFSET = -4 * HOUR

export const WEIGHTS = { review: 30, flow: 20, deadline: 20, protection: 15, leadTime: 15 }

const time = (value) => (value ? new Date(value).getTime() : null)
const happenedBy = (value, at) => value !== null && value !== undefined && time(value) <= at

function average(values) {
  return values.reduce((total, value) => total + value, 0) / values.length
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

// Data (AAAA-MM-DD) do dia em Campo Grande
export function scoreDay(now) {
  return new Date(now.getTime() + MS_OFFSET).toISOString().slice(0, 10)
}

// O último instante de cada um dos 30 dias anteriores a `now`, do mais antigo ao mais novo
export function reconstructionDays(now) {
  const today = Date.parse(`${scoreDay(now)}T00:00:00Z`) - MS_OFFSET

  return Array.from(
    { length: WINDOW_DAYS },
    (_, index) => new Date(today - (WINDOW_DAYS - 1 - index) * DAY - 1000),
  )
}

function reviewAndLeadTime(pullRequests, at) {
  const merged = pullRequests.filter(
    (pr) => happenedBy(pr.merged_at, at) && time(pr.merged_at) > at - WINDOW_DAYS * DAY,
  )
  if (merged.length === 0) return { review: null, leadTime: null }

  const hours = median(merged.map((pr) => (time(pr.merged_at) - time(pr.created_at_github)) / HOUR))
  const leadTime =
    ((LEAD_TIME_WORST_HOURS - hours) / (LEAD_TIME_WORST_HOURS - LEAD_TIME_BEST_HOURS)) * 100

  return {
    review: (merged.filter((pr) => pr.approval_count > 0).length / merged.length) * 100,
    leadTime: Math.min(100, Math.max(0, leadTime)),
  }
}

function flow(pullRequests, at) {
  const open = pullRequests.filter(
    (pr) =>
      !pr.draft &&
      happenedBy(pr.created_at_github, at) &&
      !happenedBy(pr.merged_at, at) &&
      !happenedBy(pr.closed_at, at),
  )
  if (open.length === 0) return 100

  return average(
    open.map((pr) => {
      const age = (at - time(pr.created_at_github)) / DAY

      return age <= OPEN_WARNING_DAYS ? 100 : age <= OPEN_DANGER_DAYS ? 50 : 0
    }),
  )
}

function protection(repositories, branches) {
  const mains = repositories
    .map((repository) =>
      branches.find(
        (branch) =>
          branch.repository_id === repository.id && branch.name === repository.default_branch,
      ),
    )
    .filter(Boolean)
  if (mains.length === 0) return null

  return (mains.filter((branch) => branch.protected).length / mains.length) * 100
}

function deadlineScore(deadline, now) {
  if (!deadline) return null

  const days = (Date.parse(`${deadline}T00:00:00Z`) - Date.parse(`${scoreDay(now)}T00:00:00Z`)) / DAY
  if (Number.isNaN(days)) return null

  return days < 0 ? 0 : days <= DEADLINE_WARNING_DAYS ? 50 : 100
}

// data: PRs, repositórios e branches ligados ao projeto, e o prazo dele.
// Devolve { score (0–100 ou null), components { review, flow, deadline, protection, leadTime } }
export function projectScore({ pullRequests, repositories, branches, deadline }, now) {
  const at = now.getTime()
  const hasRepositories = repositories.length > 0
  const raw = {
    ...(hasRepositories
      ? reviewAndLeadTime(
          pullRequests.filter((pr) => time(pr.created_at_github) <= at),
          at,
        )
      : { review: null, leadTime: null }),
    flow: hasRepositories ? flow(pullRequests, at) : null,
    deadline: deadlineScore(deadline, now),
    protection: hasRepositories ? protection(repositories, branches) : null,
  }

  const components = Object.fromEntries(
    Object.keys(WEIGHTS).map((key) => [key, raw[key] === null ? null : Math.round(raw[key])]),
  )
  const measured = Object.keys(WEIGHTS).filter((key) => raw[key] !== null)
  const totalWeight = measured.reduce((total, key) => total + WEIGHTS[key], 0)

  return {
    score:
      measured.length === 0
        ? null
        : Math.round(measured.reduce((total, key) => total + raw[key] * WEIGHTS[key], 0) / totalWeight),
    components,
  }
}
