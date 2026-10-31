import { COLORS } from '../constants/colors'

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
  const parsedProgress = Number(project?.progress)

  return {
    id: project?.id ?? Date.now() + index,
    name:
      typeof project?.name === 'string' && project.name.trim()
        ? project.name
        : 'Projeto sem nome',
    description:
      typeof project?.description === 'string'
        ? project.description
        : 'Sem descrição cadastrada.',
    deadline:
      typeof project?.deadline === 'string'
        ? project.deadline
        : '',
    owner:
      typeof project?.owner === 'string' && project.owner.trim()
        ? project.owner
        : 'Não definido',
    priority: validPriorities.includes(project?.priority)
      ? project.priority
      : 'medium',
    progress: Number.isFinite(parsedProgress)
      ? Math.max(0, Math.min(100, parsedProgress))
      : 0,
    repositories: Array.isArray(project?.repositories)
      ? project.repositories.filter(
          (repository) => typeof repository === 'string'
        )
      : [],
  }
}

export function getProjectStatus(project) {
  const safeProject = normalizeProject(project)

  if (!safeProject.deadline) {
    return {
      key: 'warning',
      semanticKey: 'at_risk',
      label: 'Atenção',
      color: COLORS.warning,
      icon: '🟡',
      daysRemaining: 0,
      message: 'Deadline não configurada',
    }
  }

  const today = new Date()
  const deadline = new Date(`${safeProject.deadline}T23:59:59`)

  today.setHours(0, 0, 0, 0)

  if (Number.isNaN(deadline.getTime())) {
    return {
      key: 'warning',
      semanticKey: 'at_risk',
      label: 'Atenção',
      color: COLORS.warning,
      icon: '🟡',
      daysRemaining: 0,
      message: 'Deadline inválida',
    }
  }

  const difference = deadline.getTime() - today.getTime()
  const daysRemaining = Math.ceil(difference / (1000 * 60 * 60 * 24))

  if (daysRemaining < 0) {
    return {
      key: 'danger',
      semanticKey: 'delayed',
      label: 'Atrasado',
      color: COLORS.danger,
      icon: '🔴',
      daysRemaining,
      message: `Atrasado há ${Math.abs(daysRemaining)} dia(s)`,
    }
  }

  if (daysRemaining <= 7) {
    return {
      key: 'warning',
      semanticKey: 'at_risk',
      label: 'Atenção',
      color: COLORS.warning,
      icon: '🟡',
      daysRemaining,
      message:
        daysRemaining === 0
          ? 'Deadline vence hoje'
          : `${daysRemaining} dia(s) restante(s)`,
    }
  }

  return {
    key: 'success',
    semanticKey: 'on_track',
    label: 'No prazo',
    color: COLORS.success,
    icon: '🟢',
    daysRemaining,
    message: `${daysRemaining} dia(s) restante(s)`,
  }
}