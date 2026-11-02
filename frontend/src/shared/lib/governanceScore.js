// Índice de Governança (docs/REGRAS_DE_NEGOCIO.md §5.1). A nota de cada projeto
// é calculada e gravada pela Edge Function `github`, de hora em hora; aqui só se
// organiza o que veio do banco (linhas de governance_scores) para a tela.

const DAY = 24 * 60 * 60 * 1000

export const SCORE_CRITERIA = [
  { key: 'review', label: 'Revisão de código', weight: 30 },
  { key: 'flow', label: 'Fluxo de PRs', weight: 20 },
  { key: 'deadline', label: 'Prazo', weight: 20 },
  { key: 'protection', label: 'Proteção da branch', weight: 15 },
  { key: 'leadTime', label: 'Lead time', weight: 15 },
]

export const SCORE_BANDS = { success: 'Bom', warning: 'Regular', danger: 'Crítico' }

// Regra I3
export function scoreBand(score) {
  if (score === null || score === undefined) return null

  return score >= 80 ? 'success' : score >= 60 ? 'warning' : 'danger'
}

// { [projectId]: linha do dia mais recente }
export function latestScores(scores) {
  const latest = {}

  for (const row of scores) {
    if (!latest[row.project_id] || row.day > latest[row.project_id].day) {
      latest[row.project_id] = row
    }
  }

  return latest
}

function average(values) {
  const present = values.filter((value) => value !== null && value !== undefined)

  return present.length === 0
    ? null
    : Math.round(present.reduce((total, value) => total + value, 0) / present.length)
}

// Linha da empresa: por dia, a média dos projetos que têm nota (regra I4)
export function scoreHistory(scores) {
  const byDay = new Map()

  for (const row of scores) {
    if (row.score === null) continue
    byDay.set(row.day, [...(byDay.get(row.day) ?? []), row])
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, rows]) => ({
      day,
      score: average(rows.map((row) => row.score)),
      components: Object.fromEntries(
        SCORE_CRITERIA.map(({ key }) => [key, average(rows.map((row) => row.components[key]))]),
      ),
      reconstructed: rows.some((row) => row.reconstructed),
      computedAt: rows
        .map((row) => row.computed_at)
        .sort()
        .at(-1),
    }))
}

// Variação do último dia em relação a `days` dias antes (ou ao dia anterior mais próximo)
export function scoreChange(history, days) {
  const last = history.at(-1)
  if (!last) return null

  const target = new Date(Date.parse(`${last.day}T00:00:00Z`) - days * DAY)
    .toISOString()
    .slice(0, 10)
  const before = history.filter((point) => point.day <= target).at(-1)

  return before ? last.score - before.score : null
}
