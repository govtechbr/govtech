import { PROJECT_STATUS } from '@/shared/constants/projectStatus'
import { governanceAlerts, governanceMetrics, projectHealth } from '@/shared/lib/governance'
import {
  latestScores,
  SCORE_BANDS,
  scoreBand,
  scoreChange,
  scoreHistory,
} from '@/shared/lib/governanceScore'

// Dados da empresa que vão para o Assistente de Governança (docs/REGRAS_DE_NEGOCIO.md
// §5.2, regra IA2): os mesmos números dos painéis, sem login, avatar, e-mail nem
// responsável. A Edge Function `assistant` limita o tamanho a 12 KB.

const DAY = 24 * 60 * 60 * 1000
const METRIC_DAYS = 30
const MAX_PROJECTS = 20
const MAX_ALERTS = 20
const MAX_PULL_REQUESTS = 30
// Folga abaixo dos 12 KB da Edge Function
export const MAX_CONTEXT_BYTES = 11 * 1024

const round = (value, digits = 0) =>
  value === null || value === undefined ? null : Number(value.toFixed(digits))
const daysSince = (value, now) =>
  value ? Math.floor((now.getTime() - new Date(value).getTime()) / DAY) : null

function indexSummary(scores) {
  const history = scoreHistory(scores)
  const last = history.at(-1)
  if (!last) return null

  return {
    score: last.score,
    band: SCORE_BANDS[scoreBand(last.score)],
    day: last.day,
    changeIn7Days: scoreChange(history, 7),
    components: last.components,
    history: history.map(({ day, score, reconstructed }) => ({ day, score, reconstructed })),
  }
}

// Abertos primeiro (os mais velhos antes), depois os fechados mais recentes
function pullRequestOrder(a, b) {
  const open = (pr) => (pr.state === 'open' ? 0 : 1)
  if (open(a) !== open(b)) return open(a) - open(b)
  if (open(a) === 0) return a.created_at_github.localeCompare(b.created_at_github)

  return (b.merged_at ?? b.closed_at ?? '').localeCompare(a.merged_at ?? a.closed_at ?? '')
}

export function buildAssistantContext({ organizationName, projects, governance, now }) {
  const health = projectHealth(projects, governance, now)
  const scores = latestScores(governance.scores)
  const metrics = governanceMetrics(governance, METRIC_DAYS, now)
  const projectNames = Object.fromEntries(projects.map((project) => [project.id, project.name]))
  const namesOf = (ids) => ids.map((id) => projectNames[id]).filter(Boolean)

  const context = {
    today: now.toISOString().slice(0, 10),
    organization: organizationName,
    index: indexSummary(governance.scores),
    metricsLast30Days: {
      pullRequests: metrics.pullRequestCount,
      openPullRequests: metrics.distribution.open,
      draftPullRequests: metrics.distribution.draft,
      mergedPullRequests: metrics.distribution.merged,
      averageLeadTimeHours: round(metrics.leadTimeHours, 1),
      approvalRatePercent: metrics.approvalRate,
      pullRequestsAtRisk: metrics.atRiskCount,
      repositories: metrics.events.repositories,
      commits: metrics.events.commits,
    },
    alerts: governanceAlerts(governance, projects, now)
      .slice(0, MAX_ALERTS)
      .map(({ level, title, detail, projectIds }) => ({
        level: PROJECT_STATUS[level],
        title,
        detail,
        projects: namesOf(projectIds),
      })),
    projects: projects.slice(0, MAX_PROJECTS).map((project) => ({
      name: project.name,
      status: PROJECT_STATUS[health[project.id].status],
      deadline: project.deadline || null,
      priority: project.priority ?? null,
      progressPercent: project.progress ?? null,
      index: scores[project.id]?.score ?? null,
      indexComponents: scores[project.id]?.components ?? null,
      repositories: governance.repositories
        .filter((repository) => repository.projectIds.includes(project.id))
        .map((repository) => repository.name),
    })),
    pullRequests: [...governance.pullRequests]
      .sort(pullRequestOrder)
      .slice(0, MAX_PULL_REQUESTS)
      .map((pr) => ({
        number: pr.number,
        repository: pr.repositoryName,
        title: pr.title,
        state: pr.draft && pr.state === 'open' ? 'draft' : pr.state,
        openedDaysAgo: daysSince(pr.created_at_github, now),
        mergedDaysAgo: daysSince(pr.merged_at, now),
        approvals: pr.approval_count,
        projects: namesOf(pr.projectIds),
      })),
  }

  // Muitos dados: corta os PRs mais antigos da lista até caber
  const size = () => new TextEncoder().encode(JSON.stringify(context)).length
  while (size() > MAX_CONTEXT_BYTES && context.pullRequests.length > 0) {
    context.pullRequests.pop()
  }

  return context
}
