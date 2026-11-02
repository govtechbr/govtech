import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import AssistantDialog from '@/app/AssistantDialog'
import { signOut } from '@/features/auth/api/authApi'
import { useSession } from '@/features/auth/hooks/useAuth'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { defaultSettings } from '@/shared/constants/defaultSettings'
import { storageKeys } from '@/shared/constants/storageKeys'
import { useCurrentOrganization } from '@/shared/hooks/useCurrentOrganization'
import { useLocalStorage } from '@/shared/hooks/useLocalStorage'
import { useTheme } from '@/shared/hooks/useTheme'
import { useToast } from '@/shared/hooks/useToast'
import GlobalSearch from '@/shared/layout/GlobalSearch'
import Sidebar from '@/shared/layout/Sidebar'
import Topbar from '@/shared/layout/Topbar'

const routeSections = {
  '/dashboard': 'Visão geral',
  '/audit': 'Auditoria',
  '/repositories': 'Repositórios',
  '/projects': 'Projetos',
  '/access': 'Acessos e RBAC',
  '/settings': 'Configurações',
}

const roleLabels = {
  admin: 'Administrador',
  developer: 'Desenvolvedor',
  stakeholder: 'Stakeholder',
}

// Nome, iniciais e papel de quem está logado, para a barra lateral e o menu da conta
function useAccount() {
  const user = useSession()?.user
  const { organization } = useCurrentOrganization()
  const name = user?.user_metadata?.full_name || user?.email || ''
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')

  return {
    name,
    initials,
    role: `${roleLabels[organization.role]} · ${organization.name}`,
    // Só o admin vê o código de convite (é quem chama a equipe)
    joinCode: organization.role === 'admin' ? organization.joinCode : null,
  }
}

const sectionRoutes = Object.fromEntries(
  Object.entries(routeSections).map(([route, section]) => [section, route]),
)

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)

  const [settings, setSettings] = useLocalStorage(storageKeys.SETTINGS, defaultSettings)

  const { data: projectList = [] } = useProjects()
  const account = useAccount()
  const { showToast } = useToast()

  useTheme(settings.theme)

  const activeSection = routeSections[location.pathname] || 'Visão geral'

  // Fecha os menus ao trocar de rota (ajuste de estado na renderização, sem useEffect)
  const [lastPathname, setLastPathname] = useState(location.pathname)

  if (location.pathname !== lastPathname) {
    setLastPathname(location.pathname)
    setSidebarOpen(false)
    setAccountMenuOpen(false)
  }

  function handleNavigate(section) {
    const route = sectionRoutes[section]

    if (route) {
      navigate(route)
    }
  }

  function handleSelectProject(project) {
    navigate('/projects', { state: { projectId: project.id } })
  }

  async function handleSignOut() {
    try {
      await signOut()
    } catch (error) {
      showToast(error.message, 'danger')
    }
  }

  function handleSaveSettings(nextSettings) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      ...nextSettings,
      notifications: {
        ...currentSettings.notifications,
        ...nextSettings.notifications,
      },
    }))
  }

  return (
    <div className="app-layout">
      <Sidebar
        active={activeSection}
        onNavigate={handleNavigate}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        account={account}
        onOpenAssistant={() => setAssistantOpen(true)}
      />

      {assistantOpen && <AssistantDialog onClose={() => setAssistantOpen(false)} />}

      <div className="main-content">
        <Topbar
          active={activeSection}
          setOpen={setSidebarOpen}
          onOpenSearch={() => setSearchOpen(true)}
          accountMenuOpen={accountMenuOpen}
          setAccountMenuOpen={setAccountMenuOpen}
          onNavigate={handleNavigate}
          account={account}
          onSignOut={handleSignOut}
        />

        <GlobalSearch
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          projects={projectList}
          onNavigate={handleNavigate}
          onSelectProject={handleSelectProject}
        />

        <Outlet context={{ settings, onSaveSettings: handleSaveSettings }} />
      </div>
    </div>
  )
}
