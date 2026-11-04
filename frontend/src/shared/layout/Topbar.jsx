import { Bell, ChevronRight, LogOut, Menu, Search, Settings2, UserRound } from 'lucide-react'

import InviteCode from '@/shared/layout/InviteCode'

export default function Topbar({
  active,
  setOpen,
  onOpenSearch,
  accountMenuOpen,
  setAccountMenuOpen,
  onNavigate,
  account,
  onSignOut,
}) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="icon-button menu-toggle"
          onClick={() => setOpen(true)}
          aria-label="Abrir navegação"
        >
          <Menu size={20} />
        </button>

        <div>
          <span className="breadcrumb">
            GOVTECH PLATFORM <ChevronRight size={13} /> {(active || 'Visão geral').toUpperCase()}
          </span>

          <h1>{active || 'Visão geral'}</h1>
        </div>
      </div>

      <div className="topbar-actions" style={{ position: 'relative' }}>
        <button className="icon-button search-button" onClick={onOpenSearch} aria-label="Buscar">
          <Search size={18} />
        </button>

        <button
          type="button"
          className="icon-button notification-button"
          aria-label="Notificações (em desenvolvimento)"
          title="Notificações — em desenvolvimento"
          disabled
        >
          <Bell size={18} />
        </button>

        <button
          type="button"
          className="top-avatar"
          onClick={() => setAccountMenuOpen(!accountMenuOpen)}
          aria-label={`Menu da conta de ${account.name}`}
          aria-expanded={accountMenuOpen}
          style={{ border: 0 }}
        >
          {account.initials}
        </button>

        {accountMenuOpen && (
          <div
            className="elevation-3"
            style={{
              position: 'absolute',
              zIndex: 30,
              top: 'calc(100% + 10px)',
              right: 0,
              width: '245px',
              padding: '8px',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              background: 'var(--surface)',
            }}
          >
            <div
              style={{
                marginBottom: '6px',
                padding: '10px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <strong style={{ display: 'block', fontSize: '13px' }}>{account.name}</strong>

              <small style={{ color: 'var(--muted)' }}>{account.role}</small>
            </div>

            {account.joinCode && <InviteCode code={account.joinCode} />}

            <button
              className="secondary-button"
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                marginBottom: '6px',
              }}
              onClick={() => onNavigate('Acessos e RBAC')}
            >
              <UserRound size={16} />
              Meu perfil
            </button>

            <button
              className="secondary-button"
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                marginBottom: '6px',
              }}
              onClick={() => onNavigate('Configurações')}
            >
              <Settings2 size={16} />
              Configurações
            </button>

            <button
              className="secondary-button"
              style={{
                width: '100%',
                justifyContent: 'flex-start',
              }}
              onClick={onSignOut}
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
