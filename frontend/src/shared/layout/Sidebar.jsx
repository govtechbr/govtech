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
  Plus,
  X,
} from 'lucide-react'

import { useCurrentOrganization } from '@/shared/hooks/useCurrentOrganization'
import Brand from '@/shared/ui/Brand'
import Icon from '@/shared/ui/Icon'
import ChatbotModal from './ChatbotModal'
import styles from './Sidebar.module.css'
import { auditEvents } from '@/mocks/mockData'

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

function initial(name) {
  return name.trim().charAt(0).toUpperCase()
}

export default function Sidebar({ open, setOpen, account }) {
  const navigate = useNavigate()
  const location = useLocation()

  const [showChatbot, setShowChatbot] = useState(false)
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false)
  const { organization, organizations, switchOrganization } = useCurrentOrganization()

  function isActive(path) {
    return location.pathname === path
  }

  function handleNavigate(path) {
    navigate(path)
    setOpen(false)
    setShowWorkspaceMenu(false)
  }

  // Regra A5: a escolha fica guardada e as telas recarregam com os dados da empresa
  function handleWorkspaceSelect(organizationId) {
    setShowWorkspaceMenu(false)

    if (organizationId !== organization.id) {
      switchOrganization(organizationId)
    }
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

        {/* Troca de empresa (workspace) */}
        <div className="workspace-switch">
          {!showWorkspaceMenu && (
            <button
              type="button"
              className={styles.trigger}
              onClick={() => setShowWorkspaceMenu(true)}
              aria-expanded="false"
              aria-label={`Trocar empresa (atual: ${organization.name})`}
            >
              <span className={styles.logo}>{initial(organization.name)}</span>

              <span className={styles.label}>
                <small className={styles.kicker}>Empresa</small>
                <b className={styles.name}>{organization.name}</b>
              </span>

              <ChevronDown size={14} className={styles.chevron} />
            </button>
          )}

          {showWorkspaceMenu && (
            <div>
              <div className={styles.menuHeader}>
                <span className={styles.kicker}>Selecione a empresa</span>

                <button
                  type="button"
                  className={styles.closeMenu}
                  onClick={() => setShowWorkspaceMenu(false)}
                  aria-label="Fechar seleção de empresa"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>

              <ul className={styles.options}>
                {organizations.map((candidate) => {
                  const selected = candidate.id === organization.id

                  return (
                    <li key={candidate.id}>
                      <button
                        type="button"
                        className={`${styles.option} ${selected ? styles.selected : ''}`}
                        onClick={() => handleWorkspaceSelect(candidate.id)}
                        aria-pressed={selected}
                      >
                        <span className={styles.logo}>{initial(candidate.name)}</span>
                        <span className={styles.label}>{candidate.name}</span>
                        {selected && <Check size={15} strokeWidth={2.5} className={styles.check} />}
                      </button>
                    </li>
                  )
                })}

                {/* Regra A6: criar outra empresa ou entrar com código */}
                <li>
                  <button
                    type="button"
                    className={styles.option}
                    onClick={() => handleNavigate('/organizacao')}
                  >
                    <span className={styles.logo}>
                      <Plus size={14} strokeWidth={2.5} />
                    </span>
                    <span className={styles.label}>Adicionar empresa</span>
                  </button>
                </li>
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
            <span className="avatar">{account.initials}</span>

            <span>
              <b>{account.name}</b>
              <small>{account.role}</small>
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
