import { useLocation, useOutletContext } from 'react-router-dom'

import { useSession } from '@/features/auth/hooks/useAuth'
import { useGovernanceData } from '@/features/dashboard/hooks/useGovernanceData'
import OverviewPage from '@/features/dashboard/OverviewPage'
import { useProjects } from '@/features/projects/hooks/useProjects'
import ProjectsPage from '@/features/projects/ProjectsPage'
import RbacPage from '@/features/rbac/RbacPage'
import RepositoriesPage from '@/features/repositories/RepositoriesPage'
import SettingsPage from '@/features/settings/SettingsPage'
import { useCurrentOrganization } from '@/shared/hooks/useCurrentOrganization'
import { emptyGovernance, projectHealth } from '@/shared/lib/governance'

// Adaptadores entre rotas e páginas. Uma feature não importa de outra, então o
// que vem de outra feature (projetos, sessão, papel) chega às páginas por prop.

// Espelha as regras do banco (core_schema): esconder o botão é conveniência; o RLS bloqueia
const projectPermissions = {
  admin: { create: true, edit: true, delete: true, manageGitHub: true, syncGitHub: true },
  developer: { create: true, edit: true, delete: false, manageGitHub: false, syncGitHub: true },
  stakeholder: {
    create: false,
    edit: false,
    delete: false,
    manageGitHub: false,
    syncGitHub: false,
  },
}

export function OverviewRoute() {
  const { data: projectList = [] } = useProjects()
  const governance = useGovernanceData()

  return (
    <OverviewPage
      projectList={projectList}
      governance={governance.data ?? emptyGovernance}
      isLoading={governance.isPending}
    />
  )
}

export function ProjectsRoute() {
  const location = useLocation()
  const { organization } = useCurrentOrganization()
  const { data: projectList = [] } = useProjects()
  const governance = useGovernanceData()
  // Status calculado pelos alertas (regra P3), com os dados do GitHub da Visão geral
  const health = projectHealth(projectList, governance.data ?? emptyGovernance, new Date())

  // A key remonta a página a cada navegação, para abrir o projeto escolhido na busca global
  return (
    <ProjectsPage
      key={location.key}
      initialProjectId={location.state?.projectId}
      permissions={projectPermissions[organization.role]}
      health={health}
    />
  )
}

export function RepositoriesRoute() {
  const { data: projects = [] } = useProjects()

  return <RepositoriesPage projects={projects} />
}

export function AccessRoute() {
  const { organization } = useCurrentOrganization()
  const currentUserId = useSession().user.id

  return <RbacPage organization={organization} currentUserId={currentUserId} />
}

export function SettingsRoute() {
  const { settings, onSaveSettings } = useOutletContext()

  return <SettingsPage settings={settings} onSaveSettings={onSaveSettings} />
}
