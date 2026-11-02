import { formatShortDate, hoursBetween, isWithinDays } from '@/shared/lib/date'

// Métricas, alertas e status de governança (docs/REGRAS_DE_NEGOCIO.md §5 e §6).
// Tudo calculado dos dados sincronizados do GitHub e do prazo dos projetos.
//
// `data`: { pullRequests, repositories, branches, commits }, como devolve a API
// da Visão geral (cada PR e repositório com `projectIds`).

const DAY = 24 * 60 * 60 * 1000

export const PERIODS = [7, 30, 90]
export const DEFAULT_PERIOD = 30

// Limites do §6
const OPEN_WARNING_DAYS = 1
const OPEN_DANGER_DAYS = 3
const DEADLINE_WARNING_DAYS = 7
// O alerta de PR sem aprovação olha só os mergeados neste prazo, para o status
// do projeto não depender do período escolhido na tela
const UNAPPROVED_WINDOW_DAYS = 30

export const emptyGovernance = {
  pullRequests: [],
  repositories: [],
  branches: [],
  commits: [],
  scores: [],
}

function ageInDays(value, now) {
  return (now.getTime() - new Date(value).getTime()) / DAY
}

function plural(count, singular, pluralForm) {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

function average(values) {
  return values.length > 0
    ? values.reduce((total, value) => total + value, 0) / values.length
    : null
}

function isOpen(pr) {
  return pr.state === 'open' && !pr.draft
}

export function governanceMetrics({ pullRequests, repositories, branches, commits }, days, now) {
  const createdInPeriod = (pr) => isWithinDays(pr.created_at_github, days, now)
  const merged = pullRequests.filter(
    (pr) => pr.state === 'merged' && isWithinDays(pr.merged_at, days, now),
  )
  const recentCommits = commits.filter((commit) => isWithinDays(commit.committed_at, days, now))
  const contributors = new Set(
    [
      ...recentCommits.map((commit) => commit.author_login),
      ...pullRequests.filter(createdInPeriod).map((pr) => pr.author_login),
    ].filter(Boolean),
  )

  return {
    pullRequestCount: pullRequests.filter((pr) => pr.state === 'open' || createdInPeriod(pr))
      .length,
    leadTimeHours: average(merged.map((pr) => hoursBetween(pr.created_at_github, pr.merged_at))),
    approvalRate:
      merged.length > 0
        ? Math.round((merged.filter((pr) => pr.approval_count > 0).length / merged.length) * 100)
        : null,
    atRiskCount: pullRequests.filter(
      (pr) => isOpen(pr) && ageInDays(pr.created_at_github, now) > OPEN_DANGER_DAYS,
    ).length,
    events: {
      repositories: repositories.length,
      commits: recentCommits.length,
      branches: branches.length,
      contributors: contributors.size,
    },
    distribution: {
      open: pullRequests.filter(isOpen).length,
      draft: pullRequests.filter((pr) => pr.state === 'open' && pr.draft).length,
      merged: merged.length,
      closed: pullRequests.filter(
        (pr) => pr.state === 'closed' && isWithinDays(pr.closed_at, days, now),
      ).length,
    },
  }
}

// PRs abertos × mergeados por semana, da mais antiga à atual (a última termina agora)
export function weeklyFlow(pullRequests, weeks, now) {
  return Array.from({ length: weeks }, (_, index) => {
    const end = now.getTime() - (weeks - 1 - index) * 7 * DAY
    const start = end - 7 * DAY
    const inWeek = (value) => {
      const time = value ? new Date(value).getTime() : NaN
      return time >= start && time < end
    }

    return {
      label: formatShortDate(new Date(start)),
      opened: pullRequests.filter((pr) => inWeek(pr.created_at_github)).length,
      merged: pullRequests.filter((pr) => pr.state === 'merged' && inWeek(pr.merged_at)).length,
    }
  })
}

// Dias até o prazo (negativo = vencido), contando por data, sem horário
function daysUntil(deadline, now) {
  if (!deadline) return null

  const due = new Date(`${deadline}T00:00:00`)
  if (Number.isNaN(due.getTime())) return null

  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  // round absorve a hora a mais ou a menos do horário de verão
  return Math.round((due.getTime() - today.getTime()) / DAY)
}

function pullRequestDetail(pr) {
  return `#${pr.number} · ${pr.repositoryName} · ${pr.title}`
}

export function governanceAlerts({ pullRequests, repositories, branches }, projects, now) {
  const alerts = []

  for (const pr of pullRequests.filter(isOpen)) {
    const age = ageInDays(pr.created_at_github, now)

    if (age > OPEN_WARNING_DAYS) {
      alerts.push({
        id: `pr-open-${pr.id}`,
        level: age > OPEN_DANGER_DAYS ? 'danger' : 'warning',
        title: `PR aberto há ${plural(Math.floor(age), 'dia', 'dias')}`,
        detail: pullRequestDetail(pr),
        href: pr.html_url,
        projectIds: pr.projectIds,
      })
    }
  }

  for (const pr of pullRequests) {
    if (
      pr.state === 'merged' &&
      pr.approval_count === 0 &&
      isWithinDays(pr.merged_at, UNAPPROVED_WINDOW_DAYS, now)
    ) {
      alerts.push({
        id: `pr-unapproved-${pr.id}`,
        level: 'warning',
        title: 'PR mergeado sem aprovação',
        detail: pullRequestDetail(pr),
        href: pr.html_url,
        projectIds: pr.projectIds,
      })
    }
  }

  for (const repository of repositories) {
    const main = branches.find(
      (branch) =>
        branch.repository_id === repository.id && branch.name === repository.default_branch,
    )

    if (main && !main.protected) {
      alerts.push({
        id: `branch-${repository.id}`,
        level: 'warning',
        title: 'Branch principal sem proteção',
        detail: `${repository.name} · ${main.name}`,
        projectIds: repository.projectIds,
      })
    }
  }

  for (const project of projects) {
    const days = daysUntil(project.deadline, now)

    if (days !== null && days < 0) {
      alerts.push({
        id: `deadline-${project.id}`,
        level: 'danger',
        title: 'Prazo vencido',
        detail: `${project.name} · venceu há ${plural(-days, 'dia', 'dias')}`,
        projectIds: [project.id],
      })
    } else if (days !== null && days <= DEADLINE_WARNING_DAYS) {
      alerts.push({
        id: `deadline-${project.id}`,
        level: 'warning',
        title: 'Prazo perto do fim',
        detail: `${project.name} · ${days === 0 ? 'vence hoje' : `vence em ${plural(days, 'dia', 'dias')}`}`,
        projectIds: [project.id],
      })
    }
  }

  // Risco antes de Atenção; dentro de cada nível, a ordem acima
  return [
    ...alerts.filter(({ level }) => level === 'danger'),
    ...alerts.filter(({ level }) => level === 'warning'),
  ]
}

// Status do projeto (P3): Risco se tiver alerta de Risco; senão Atenção se tiver
// alerta de Atenção; senão Saudável. Devolve { [projectId]: { status, alerts } }
export function projectHealth(projects, data, now) {
  const alerts = governanceAlerts(data, projects, now)

  return Object.fromEntries(
    projects.map((project) => {
      const own = alerts.filter(({ projectIds }) => projectIds.includes(project.id))
      const status = own.some(({ level }) => level === 'danger')
        ? 'danger'
        : own.length > 0
          ? 'warning'
          : 'success'

      return [project.id, { status, alerts: own }]
    }),
  )
}
