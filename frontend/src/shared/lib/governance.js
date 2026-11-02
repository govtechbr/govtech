import { formatShortDate, hoursBetween, isWithinDays } from '@/shared/lib/date'

// Métricas, alertas e status de governança (docs/REGRAS_DE_NEGOCIO.md §5 e §6).
// Tudo calculado dos dados sincronizados do GitHub e do prazo dos projetos.
//
// `data`: { pullRequests, repositories, branches, commits, ciRuns }, como devolve a API
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
  ciRuns: [],
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

// Falhas do CI (G11): uma por sequência de execuções falhando no mesmo workflow e
// branch, até a próxima que passou. Canceladas, puladas e as em andamento não
// interrompem a sequência. Só as que começaram no período, da mais recente à mais antiga
export function ciIncidents(ciRuns = [], days, now) {
  const finished = ciRuns
    .filter(({ conclusion }) => conclusion === 'success' || conclusion === 'failure')
    .sort((a, b) => new Date(a.started_at) - new Date(b.started_at))
  const open = new Map()
  const incidents = []

  for (const run of finished) {
    const key = `${run.repositoryName}|${run.workflow_name}|${run.head_branch}`
    const current = open.get(key)

    if (run.conclusion === 'failure') {
      if (current) {
        current.failedRuns += 1
      } else {
        const incident = {
          id: run.id,
          runNumber: run.run_number,
          workflow: run.workflow_name,
          branch: run.head_branch,
          repositoryName: run.repositoryName,
          href: run.html_url,
          startedAt: run.started_at,
          failedAt: run.completed_at,
          failedRuns: 1,
          recoveryHours: null,
        }
        open.set(key, incident)
        incidents.push(incident)
      }
    } else if (current) {
      current.recoveryHours = hoursBetween(current.failedAt, run.completed_at)
      open.delete(key)
    }
  }

  return incidents
    .filter((incident) => isWithinDays(incident.startedAt, days, now))
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
}

export function governanceMetrics(
  { pullRequests, repositories, branches, commits, ciRuns = [] },
  days,
  now,
) {
  const createdInPeriod = (pr) => isWithinDays(pr.created_at_github, days, now)
  const merged = pullRequests.filter(
    (pr) => pr.state === 'merged' && isWithinDays(pr.merged_at, days, now),
  )
  // Execuções do CI no período (G11): só as concluídas com sucesso ou falha
  const runsInPeriod = ciRuns.filter(
    (run) =>
      (run.conclusion === 'success' || run.conclusion === 'failure') &&
      isWithinDays(run.started_at, days, now),
  )
  const recovered = ciIncidents(ciRuns, days, now).filter(
    ({ recoveryHours }) => recoveryHours !== null,
  )

  // CI verde no merge (G10): só os mergeados que tinham CI
  const mergedWithCi = merged.filter((pr) => pr.ci_state != null)
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
    ciSuccessRate:
      mergedWithCi.length > 0
        ? Math.round(
            (mergedWithCi.filter((pr) => pr.ci_state === 'success').length / mergedWithCi.length) *
              100,
          )
        : null,
    ciRunSuccessRate:
      runsInPeriod.length > 0
        ? Math.round(
            (runsInPeriod.filter((run) => run.conclusion === 'success').length /
              runsInPeriod.length) *
              100,
          )
        : null,
    ciRecoveryHours: average(recovered.map(({ recoveryHours }) => recoveryHours)),
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

// Por que cada alerta importa (§6), mostrado junto do alerta
const REASONS = {
  ciMain: 'A versão atual da branch principal não passa nos testes automáticos.',
  ciMerged: 'Entrou na branch principal código que não passou nos testes automáticos.',
  ciOpen: 'O PR precisa de correção antes de ser revisado e mergeado.',
  branch:
    'Sem proteção, qualquer pessoa com acesso pode fazer push direto na branch principal ou reescrever o histórico, sem PR nem revisão.',
  unapproved:
    'Entrou na branch principal sem nenhuma revisão aprovada: o código não passou pelo controle de revisão.',
  deadlineOverdue: 'O prazo passou: replaneje a entrega ou registre a nova data.',
  deadlineSoon: 'Faltam poucos dias: confira se o que falta cabe no prazo.',
  open: 'PR parado acumula conflitos e atrasa a entrega: revise, peça mudanças ou feche.',
}

// Dentro do mesmo nível, os riscos estruturais primeiro (§6)
const KIND_ORDER = ['ciMain', 'branch', 'ciMerged', 'unapproved', 'deadline', 'ciOpen', 'open']

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
        kind: 'open',
        level: age > OPEN_DANGER_DAYS ? 'danger' : 'warning',
        title: `PR aberto há ${plural(Math.floor(age), 'dia', 'dias')}`,
        detail: pullRequestDetail(pr),
        reason: REASONS.open,
        href: pr.html_url,
        projectIds: pr.projectIds,
      })
    }
  }

  // CI (G10): o estado do último commit na hora da sincronização
  for (const pr of pullRequests) {
    const recentMerge =
      pr.state === 'merged' && isWithinDays(pr.merged_at, UNAPPROVED_WINDOW_DAYS, now)

    if (pr.ci_state === 'failure' && (isOpen(pr) || recentMerge)) {
      alerts.push({
        id: `pr-ci-${pr.id}`,
        kind: isOpen(pr) ? 'ciOpen' : 'ciMerged',
        level: isOpen(pr) ? 'warning' : 'danger',
        title: isOpen(pr) ? 'PR com CI falhando' : 'PR mergeado com CI falhando',
        detail: pullRequestDetail(pr),
        reason: isOpen(pr) ? REASONS.ciOpen : REASONS.ciMerged,
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
        kind: 'unapproved',
        level: 'warning',
        title: 'PR mergeado sem aprovação',
        detail: pullRequestDetail(pr),
        reason: REASONS.unapproved,
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

    if (repository.ci_state === 'failure') {
      alerts.push({
        id: `ci-main-${repository.id}`,
        kind: 'ciMain',
        level: 'danger',
        title: 'CI falhando na branch principal',
        detail: `${repository.name} · ${repository.default_branch}`,
        reason: REASONS.ciMain,
        projectIds: repository.projectIds,
      })
    }

    if (main && !main.protected) {
      alerts.push({
        id: `branch-${repository.id}`,
        kind: 'branch',
        level: 'warning',
        title: 'Branch principal sem proteção',
        detail: `${repository.name} · ${main.name}`,
        reason: REASONS.branch,
        projectIds: repository.projectIds,
      })
    }
  }

  for (const project of projects) {
    const days = daysUntil(project.deadline, now)

    if (days !== null && days < 0) {
      alerts.push({
        id: `deadline-${project.id}`,
        kind: 'deadline',
        level: 'danger',
        title: 'Prazo vencido',
        detail: `${project.name} · venceu há ${plural(-days, 'dia', 'dias')}`,
        reason: REASONS.deadlineOverdue,
        projectIds: [project.id],
      })
    } else if (days !== null && days <= DEADLINE_WARNING_DAYS) {
      alerts.push({
        id: `deadline-${project.id}`,
        kind: 'deadline',
        level: 'warning',
        title: 'Prazo perto do fim',
        detail: `${project.name} · ${days === 0 ? 'vence hoje' : `vence em ${plural(days, 'dia', 'dias')}`}`,
        reason: REASONS.deadlineSoon,
        projectIds: [project.id],
      })
    }
  }

  // Risco antes de Atenção; dentro de cada nível, KIND_ORDER (sort é estável)
  const rank = ({ level, kind }) => (level === 'danger' ? 0 : 1) * 10 + KIND_ORDER.indexOf(kind)
  return alerts.sort((a, b) => rank(a) - rank(b))
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
