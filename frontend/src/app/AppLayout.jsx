import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { getStoredProjects, saveProjects } from '@/features/projects/utils/storageUtils'
import { projects as initialProjects } from '@/mocks/mockData'
import { defaultSettings } from '@/shared/constants/defaultSettings'
import { storageKeys } from '@/shared/constants/storageKeys'
import { useLocalStorage } from '@/shared/hooks/useLocalStorage'
import { useTheme } from '@/shared/hooks/useTheme'
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

const sectionRoutes = Object.fromEntries(
  Object.entries(routeSections).map(([route, section]) => [section, route]),
)

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const [settings, setSettings] = useLocalStorage(storageKeys.SETTINGS, defaultSettings)

  const [projectList, setProjectList] = useState(() => getStoredProjects(initialProjects))

  useTheme(settings.theme)

  const activeSection = routeSections[location.pathname] || 'Visão geral'

  useEffect(() => {
    saveProjects(projectList)
  }, [projectList])

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
        settings={settings}
        setSettings={setSettings}
      />

      <div className="main-content">
        <Topbar
          active={activeSection}
          setOpen={setSidebarOpen}
          onOpenSearch={() => setSearchOpen(true)}
          accountMenuOpen={accountMenuOpen}
          setAccountMenuOpen={setAccountMenuOpen}
          onNavigate={handleNavigate}
        />

        <GlobalSearch
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          projects={projectList}
          onNavigate={handleNavigate}
          onSelectProject={handleSelectProject}
        />

        <Outlet
          context={{ projectList, setProjectList, settings, onSaveSettings: handleSaveSettings }}
        />
      </div>
    </div>
  )
}
