import { hoursBetween, isWithinDays } from '@/shared/lib/date'

// Números da tela calculados a partir dos PRs sincronizados (nada fixo)
export function pullRequestMetrics(pullRequests, now = new Date()) {
  const merged = pullRequests.filter((pr) => pr.state === 'merged')
  const mergedRecently = merged.filter((pr) => isWithinDays(pr.merged_at, 30, now))
  const mergeHours = mergedRecently.map((pr) => hoursBetween(pr.created_at_github, pr.merged_at))

  return {
    open: pullRequests.filter((pr) => pr.state === 'open').length,
    mergedLast30Days: mergedRecently.length,
    averageMergeHours:
      mergeHours.length > 0
        ? mergeHours.reduce((total, hours) => total + hours, 0) / mergeHours.length
        : null,
  }
}
