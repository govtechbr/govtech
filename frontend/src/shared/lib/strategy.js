// Status de um objetivo estratégico (docs/REGRAS_DE_NEGOCIO.md §10, S4 e S5): o pior
// status entre os projetos vinculados. A relação entre falha técnica e meta vem do
// vínculo; o sistema não estima prazo nem custo do impacto.

const SEVERITY = { success: 0, warning: 1, danger: 2 }

// health: { [projectId]: { status, alerts } }, de projectHealth (regra P3)
// Devolve { status, projects: [{ project, status, alerts }] }; sem projeto: status null
export function objectiveStatus(objective, projects, health) {
  const linked = projects
    .filter((project) => project.objectiveId === objective.id)
    .map((project) => ({
      project,
      status: health[project.id]?.status ?? 'success',
      alerts: health[project.id]?.alerts ?? [],
    }))

  const status = linked.reduce(
    (worst, item) =>
      worst === null || SEVERITY[item.status] > SEVERITY[worst] ? item.status : worst,
    null,
  )

  // Os projetos mais graves primeiro
  linked.sort((a, b) => SEVERITY[b.status] - SEVERITY[a.status])

  return { status, projects: linked }
}
