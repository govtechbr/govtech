import { useEffect, useState } from 'react'

import { DEFAULT_SETTINGS } from '../constants/defaultSettings'
import { projects as initialProjects } from '../data/mockData'
import { useTheme } from '../hooks/useTheme'
import {
  getStoredProjects,
  getStoredSettings,
  saveProjects,
  saveSettings,
} from '../utils/storageUtils'

import Toast from '../components/common/Toast'
import DashboardLayout from '../components/layout/DashboardLayout'

import AuditPage from './AuditPage'
import OverviewPage from './OverviewPage'
import ProjectsPage from './ProjectsPage'
import RbacPage from './RbacPage'
import RepositoriesPage from './RepositoriesPage'
import SettingsPage from './SettingsPage'

export default function DashboardPage() {
  const [active, setActive] = useState('Visão geral')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [selectedProjectFromSearch, setSelectedProjectFromSearch] =
    useState(null)
  const [toast, setToast] = useState(null)

  const [projectList, setProjectList] = useState(() =>
    getStoredProjects(initialProjects)
  )

  const [settings, setSettings] = useState(() => getStoredSettings())

  useTheme(settings.theme)

  useEffect(() => {
    saveProjects(projectList)
  }, [projectList])

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    const closeMenu = () => setAccountMenuOpen(false)

    window.addEventListener('click', closeMenu)

    return () => {
      window.removeEventListener('click', closeMenu)
    }
  }, [])

  const showToast = (message, type = 'success') => {
    setToast({
      id: Date.now(),
      message,
      type,
    })
  }

  const saveNewSettings = (newSettings) => {
    setSettings({
      ...newSettings,
      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...(newSettings.notifications || {}),
      },
    })
  }

  const renderPage = () => {
    switch (active) {
      case 'Visão geral':
        return <OverviewPage projectList={projectList} />

      case 'Auditoria':
        return <AuditPage />

      case 'Repositórios':
        return <RepositoriesPage />

      case 'Projetos':
        return (
          <ProjectsPage
            projectList={projectList}
            setProjectList={setProjectList}
            onToast={showToast}
            externalSelectedProject={selectedProjectFromSearch}
            onClearExternalSelectedProject={() =>
              setSelectedProjectFromSearch(null)
            }
          />
        )

      case 'Acessos e RBAC':
        return <RbacPage />

      case 'Configurações':
        return (
          <SettingsPage
            settings={settings}
            onSaveSettings={saveNewSettings}
            onToast={showToast}
          />
        )

      default:
        return <OverviewPage projectList={projectList} />
    }
  }

  return (
    <>
      <DashboardLayout
        active={active}
        setActive={setActive}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        settings={settings}
        searchOpen={searchOpen}
        setSearchOpen={setSearchOpen}
        accountMenuOpen={accountMenuOpen}
        setAccountMenuOpen={setAccountMenuOpen}
        projectList={projectList}
        setSelectedProjectFromSearch={setSelectedProjectFromSearch}
      >
        {renderPage()}
      </DashboardLayout>

      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
}