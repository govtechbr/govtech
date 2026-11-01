import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  Sparkles,
  Users,
  Settings2,
  Check,
  X,
} from 'lucide-react'

import Brand from '@/shared/ui/Brand'
import Icon from '@/shared/ui/Icon'
import ChatbotModal from './ChatbotModal'
import styles from './Sidebar.module.css'
import { auditEvents, profile } from '@/mocks/mockData'

const menuItems = [
  {
    label: 'Visão geral',
    icon: 'BarChart3',
    path: '/dashboard',
  },
  {
    label: 'Auditoria',
    icon: 'LockKeyhole',
    path: '/audit',
  },
  {
    label: 'Repositórios',
    icon: 'GitBranch',
    path: '/repositories',
  },
  {
    label: 'Projetos',
    icon: 'Target',
    path: '/projects',
  },
]

const adminItems = [
  {
    label: 'Acessos e RBAC',
    icon: 'Users',
    path: '/access',
  },
  {
    label: 'Configurações',
    icon: 'Settings2',
    path: '/settings',
  },
]

const workspaces = [
  { id: 1, name: 'govtech-platform', logo: 'G' },
  { id: 2, name: 'govtech-ms', logo: 'M' },
  { id: 3, name: 'govtech-ti', logo: 'T' },
]

export default function Sidebar({ open, setOpen, settings, setSettings }) {
  const navigate = useNavigate()
  const location = useLocation()

  const [showChatbot, setShowChatbot] = useState(false)
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false)

  const selectedWorkspace =
    workspaces.find((workspace) => workspace.name === settings?.organizationName) || workspaces[0]

  function isActive(path) {
    return location.pathname === path
  }

  function handleNavigate(path) {
    navigate(path)
    setOpen(false)
    setShowWorkspaceMenu(false)
  }

  function handleWorkspaceSelect(workspace) {
    setSettings((previousSettings) => ({
      ...previousSettings,
      organizationName: workspace.name,
    }))

    setShowWorkspaceMenu(false)
  }

  return (
    <>
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-head">
          <Brand compact />

          <button
            type="button"
            className="icon-button sidebar-close"
            onClick={() => setOpen(false)}
            aria-label="Fechar navegação"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        {/* Workspace Switcher */}
        <div className="workspace-switch">
          {!showWorkspaceMenu && (
            <button
              type="button"
              className={styles.trigger}
              onClick={() => setShowWorkspaceMenu(true)}
              aria-expanded="false"
              aria-label={`Trocar workspace (atual: ${selectedWorkspace.name})`}
            >
              <span className={styles.logo}>{selectedWorkspace.logo}</span>

              <span className={styles.label}>
                <small className={styles.kicker}>Workspace</small>
                <b className={styles.name}>{selectedWorkspace.name}</b>
              </span>

              <ChevronDown size={14} className={styles.chevron} />
            </button>
          )}

          {showWorkspaceMenu && (
            <div>
              <div className={styles.menuHeader}>
                <span className={styles.kicker}>Selecione o workspace</span>

                <button
                  type="button"
                  className={styles.closeMenu}
                  onClick={() => setShowWorkspaceMenu(false)}
                  aria-label="Fechar seleção de workspace"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>

              <ul className={styles.options}>
                {workspaces.map((workspace) => {
                  const selected = selectedWorkspace.name === workspace.name

                  return (
                    <li key={workspace.id}>
                      <button
                        type="button"
                        className={`${styles.option} ${selected ? styles.selected : ''}`}
                        onClick={() => handleWorkspaceSelect(workspace)}
                        aria-pressed={selected}
                      >
                        <span className={styles.logo}>{workspace.logo}</span>
                        <span className={styles.label}>{workspace.name}</span>
                        {selected && <Check size={15} strokeWidth={2.5} className={styles.check} />}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Navegação */}
        <nav className="side-nav">
          <span className="nav-label">OBSERVABILIDADE</span>

          {menuItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className={isActive(item.path) ? 'active' : ''}
              onClick={() => handleNavigate(item.path)}
            >
              <Icon name={item.icon} size={18} />

              <span>{item.label}</span>

              {item.label === 'Auditoria' && (
                <span className="nav-count">{auditEvents.length}</span>
              )}
            </button>
          ))}

          <span className="nav-label nav-label-spaced">ADMINISTRAÇÃO</span>

          {adminItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className={isActive(item.path) ? 'active' : ''}
              onClick={() => handleNavigate(item.path)}
            >
              {item.icon === 'Users' ? <Users size={18} /> : <Settings2 size={18} />}

              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button
            type="button"
            className="support-card"
            onClick={() => setShowChatbot(true)}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <Sparkles size={17} />

            <div>
              <b>Precisa de ajuda?</b>
              <span>Veja o guia de governança</span>
            </div>

            <ChevronRight size={15} />
          </button>

          <div className="profile-row">
            <span className="avatar">{profile.initials}</span>

            <span>
              <b>{profile.name}</b>
              <small>{profile.role}</small>
            </span>
          </div>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          className="sidebar-overlay"
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
        />
      )}

      {showChatbot && <ChatbotModal onClose={() => setShowChatbot(false)} />}
    </>
  )
}
