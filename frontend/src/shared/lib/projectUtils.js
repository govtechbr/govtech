export function formatProjectDate(date) {
  if (!date) return '-'

  const parsedDate = new Date(`${date}T12:00:00`)

  if (Number.isNaN(parsedDate.getTime())) {
    return date
  }

  return parsedDate.toLocaleDateString('pt-BR')
}

export function normalizeProject(project, index = 0) {
  const validPriorities = ['high', 'medium', 'low']

  return {
    id: project?.id ?? Date.now() + index,
    name:
      typeof project?.name === 'string' && project.name.trim() ? project.name : 'Projeto sem nome',
    description:
      typeof project?.description === 'string' ? project.description : 'Sem descrição cadastrada.',
    deadline: typeof project?.deadline === 'string' ? project.deadline : '',
    owner:
      typeof project?.owner === 'string' && project.owner.trim() ? project.owner : 'Não definido',
    priority: validPriorities.includes(project?.priority) ? project.priority : 'medium',
  }
}
