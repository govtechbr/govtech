import { useEffect, useState } from 'react'
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import GlobalSearch from './components/layout/GlobalSearch'
import AuditPage from './pages/AuditPage'
import RepositoriesPage from './pages/RepositoriesPage'
import ProjectsPage from './pages/ProjectsPage'
import RbacPage from './pages/RbacPage'
import SettingsPage from './pages/SettingsPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/LandingPage'

import { defaultSettings } from './constants/defaultSettings'
import { useLocalStorage } from './hooks/useLocalStorage'
import { storageKeys } from './constants/storageKeys'
import { getStoredProjects } from './utils/storageUtils'
import { projects as initialProjects } from './data/mockData'

import { Check } from 'lucide-react'

import './tokens.css'
import './index.css'

const routeSections = {
  '/dashboard': 'Visão geral',
  '/audit': 'Auditoria',
  '/repositories': 'Repositórios',
  '/projects': 'Projetos',
  '/access': 'Acessos e RBAC',
  '/settings': 'Configurações',
}

const sectionRoutes = {
  'Visão geral': '/dashboard',
  Auditoria: '/audit',
  Repositórios: '/repositories',
  Projetos: '/projects',
  'Acessos e RBAC': '/access',
  Configurações: '/settings',
}

function AuthenticatedLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [toastMessage, setToastMessage] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(true)

  const [settings, setSettings] = useLocalStorage(
    storageKeys.SETTINGS,
    defaultSettings,
  )

  const [projectList, setProjectList] = useState(() => getStoredProjects(initialProjects))

  const activeSection =
    routeSections[location.pathname] || 'Visão geral'

  useEffect(() => {
    setSidebarOpen(false)
    setAccountMenuOpen(false)
  }, [location.pathname])

  function handleNavigate(section) {
    const route = sectionRoutes[section]

    if (route) {
      navigate(route)
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

    if (nextSettings.theme) {
      document.documentElement.dataset.theme =
        nextSettings.theme === 'Escuro' ? 'dark' : 'light'
    }
  }

  function handleToast(message) {
    setToastMessage(message)

    window.setTimeout(() => {
      setToastMessage('')
    }, 3000)
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
          onOpenSearch={() => { }}
          accountMenuOpen={accountMenuOpen}
          setAccountMenuOpen={setAccountMenuOpen}
          onNavigate={handleNavigate}
        />

        <GlobalSearch />

        {activeSection === 'Visão geral' && (
          <DashboardPage
            activeSection={activeSection}
            setActiveSection={handleNavigate}
            settings={settings}
            setSettings={setSettings}
            isAuthenticated={isAuthenticated}
            setIsAuthenticated={setIsAuthenticated}
          />
        )}

        {activeSection === 'Auditoria' && <AuditPage />}

        {activeSection === 'Repositórios' && <RepositoriesPage />}

        {activeSection === 'Projetos' && (
          <ProjectsPage
            projectList={projectList}
            setProjectList={setProjectList}
            onToast={handleToast}
          />
        )}

        {activeSection === 'Acessos e RBAC' && <RbacPage />}

        {activeSection === 'Configurações' && (
          <SettingsPage
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onToast={handleToast}
          />
        )}
      </div>
      {toastMessage && (
        <div
          className="elevation-3"
          style={{
            position: 'fixed',
            right: '24px',
            bottom: '24px',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 16px',
            color: 'var(--text-primary)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
          }}
        >
          <Check size={17} color="var(--color-success)" />
          {toastMessage}
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/landing" element={<LandingPage />} />

      <Route path="/dashboard" element={<AuthenticatedLayout />} />
      <Route path="/audit" element={<AuthenticatedLayout />} />
      <Route path="/repositories" element={<AuthenticatedLayout />} />
      <Route path="/projects" element={<AuthenticatedLayout />} />
      <Route path="/access" element={<AuthenticatedLayout />} />
      <Route path="/settings" element={<AuthenticatedLayout />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}