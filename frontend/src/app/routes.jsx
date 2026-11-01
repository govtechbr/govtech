import { useLocation, useOutletContext } from 'react-router-dom'

import OverviewPage from '@/features/dashboard/OverviewPage'
import ProjectsPage from '@/features/projects/ProjectsPage'
import SettingsPage from '@/features/settings/SettingsPage'

// Ligam o estado do AppLayout (via <Outlet context>) às páginas.
// Saem na etapa 5, quando os dados de projeto passam para o TanStack Query.

export function OverviewRoute() {
  const { projectList } = useOutletContext()

  return <OverviewPage projectList={projectList} />
}

export function ProjectsRoute() {
  const { projectList, setProjectList } = useOutletContext()
  const location = useLocation()

  // A key remonta a página a cada navegação, para abrir o projeto escolhido na busca global
  return (
    <ProjectsPage
      key={location.key}
      projectList={projectList}
      setProjectList={setProjectList}
      initialProjectId={location.state?.projectId}
    />
  )
}

export function SettingsRoute() {
  const { settings, onSaveSettings } = useOutletContext()

  return <SettingsPage settings={settings} onSaveSettings={onSaveSettings} />
}
