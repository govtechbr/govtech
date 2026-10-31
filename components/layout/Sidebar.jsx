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

import Brand from '../common/Brand'
import Icon from '../common/Icon'
import ChatbotModal from '../common/ChatbotModal'
import { auditEvents, profile } from '../../data/mockData'

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

export default function Sidebar({
  open,
  setOpen,
  settings,
  setSettings,
}) {
  const navigate = useNavigate()
  const location = useLocation()

  const [showChatbot, setShowChatbot] = useState(false)
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false)

  const selectedWorkspace =
    workspaces.find(
      (workspace) => workspace.name === settings?.organizationName,
    ) || workspaces[0]

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
              onClick={() => setShowWorkspaceMenu(true)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 10px',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(event) => {
                event.currentTarget.style.backgroundColor =
                  'var(--bg-secondary, #f5f5f5)'
              }}
              onMouseOut={(event) => {
                event.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '5px',
                  backgroundColor: 'var(--color-primary-600, #7A58C4)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: '600',
                  flexShrink: 0,
                }}
              >
                {selectedWorkspace.logo}
              </span>

              <span style={{ flex: 1 }}>
                <small
                  style={{
                    display: 'block',
                    fontSize: '9px',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    marginBottom: '1px',
                    letterSpacing: '0.3px',
                  }}
                >
                  WORKSPACE
                </small>

                <b
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                  }}
                >
                  {selectedWorkspace.name}
                </b>
              </span>

              <ChevronDown size={14} style={{ color: 'var(--muted)' }} />
            </button>
          )}

          {showWorkspaceMenu && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                  paddingBottom: '10px',
                  paddingRight: '4px',
                  borderBottom: '1px solid var(--border, #e5e7eb)',
                }}
              >
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                  }}
                >
                  Selecione o workspace
                </span>

                <button
                  type="button"
                  onClick={() => setShowWorkspaceMenu(false)}
                  aria-label="Fechar seleção de workspace"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: '35px',
                    padding: '5px',
                    color: 'white',
                    background: 'var(--color-primary-600, #7A58C4)',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(event) => {
                    event.currentTarget.style.backgroundColor =
                      'var(--color-primary-700, #5F429D)'
                    event.currentTarget.style.transform = 'scale(1.05)'
                  }}
                  onMouseOut={(event) => {
                    event.currentTarget.style.backgroundColor =
                      'var(--color-primary-600, #7A58C4)'
                    event.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>

              {workspaces.map((workspace) => {
                const selected =
                  selectedWorkspace.name === workspace.name

                return (
                  <button
                    key={workspace.id}
                    type="button"
                    onClick={() => handleWorkspaceSelect(workspace)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '4px',
                      padding: '8px 10px',
                      backgroundColor: selected
                        ? 'var(--surface, white)'
                        : 'transparent',
                      border: '1px solid transparent',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={(event) => {
                      if (!selected) {
                        event.currentTarget.style.backgroundColor =
                          'var(--surface, white)'
                        event.currentTarget.style.borderColor =
                          'var(--border, #e5e7eb)'
                      }
                    }}
                    onMouseOut={(event) => {
                      if (!selected) {
                        event.currentTarget.style.backgroundColor =
                          'transparent'
                        event.currentTarget.style.borderColor =
                          'transparent'
                      }
                    }}
                  >
                    <span
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '5px',
                        backgroundColor: selected
                          ? 'var(--color-primary-600, #7A58C4)'
                          : 'var(--bg-tertiary, #e5e7eb)',
                        color: selected
                          ? 'white'
                          : 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: '600',
                        flexShrink: 0,
                      }}
                    >
                      {workspace.logo}
                    </span>

                    <span
                      style={{
                        flex: 1,
                        color: selected
                          ? 'var(--text-primary)'
                          : 'var(--text-secondary)',
                        fontSize: '12px',
                        fontWeight: selected ? '600' : '500',
                      }}
                    >
                      {workspace.name}
                    </span>

                    {selected && (
                      <Check
                        size={15}
                        strokeWidth={2.5}
                        color="var(--color-primary-600, #7A58C4)"
                      />
                    )}
                  </button>
                )
              })}
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

          <span className="nav-label nav-label-spaced">
            ADMINISTRAÇÃO
          </span>

          {adminItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className={isActive(item.path) ? 'active' : ''}
              onClick={() => handleNavigate(item.path)}
            >
              {item.icon === 'Users' ? (
                <Users size={18} />
              ) : (
                <Settings2 size={18} />
              )}

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

      {showChatbot && (
        <ChatbotModal onClose={() => setShowChatbot(false)} />
      )}
    </>
  )
}