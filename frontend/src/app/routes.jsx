import { useLocation, useOutletContext } from 'react-router-dom'

import OverviewPage from '@/features/dashboard/OverviewPage'
import { useProjects } from '@/features/projects/hooks/useProjects'
import ProjectsPage from '@/features/projects/ProjectsPage'
import SettingsPage from '@/features/settings/SettingsPage'

// Adaptadores entre rotas e páginas. A Visão geral recebe os projetos por prop
// porque uma feature (dashboard) não importa de outra (projects).

export function OverviewRoute() {
  const { data: projectList = [] } = useProjects()

  return <OverviewPage projectList={projectList} />
}

export function ProjectsRoute() {
  const location = useLocation()

  // A key remonta a página a cada navegação, para abrir o projeto escolhido na busca global
  return <ProjectsPage key={location.key} initialProjectId={location.state?.projectId} />
}

export function SettingsRoute() {
  const { settings, onSaveSettings } = useOutletContext()

  return <SettingsPage settings={settings} onSaveSettings={onSaveSettings} />
}
