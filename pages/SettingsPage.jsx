import { useEffect, useState } from 'react'
import {
  Bell,
  BriefcaseBusiness,
  Check,
  Code2,
  Eye,
  GitFork,
  LockKeyhole,
  Settings2,
  Shield,
  Sparkles,
  Target,
  TimerReset,
} from 'lucide-react'

import StatusBadge from '../components/common/StatusBadge'

export default function SettingsPage({
  settings,
  onSaveSettings,
  onToast,
}) {
  const [tab, setTab] = useState('geral')

  const [draft, setDraft] = useState({
    organizationName: settings.organizationName,
    timezone: settings.timezone,
    theme: settings.theme,
    notifications: {
      ...settings.notifications,
    },
  })

  useEffect(() => {
    setDraft({
      organizationName: settings.organizationName,
      timezone: settings.timezone,
      theme: settings.theme,
      notifications: {
        ...settings.notifications,
      },
    })
  }, [settings])

  function save() {
    onSaveSettings(draft)
    onToast('Configurações salvas com sucesso.')
  }

  function toggleNotification(key) {
    setDraft((current) => ({
      ...current,
      notifications: {
        ...current.notifications,
        [key]: !current.notifications[key],
      },
    }))
  }

  const tabs = [
    { id: 'geral', label: 'Geral', icon: Settings2 },
    { id: 'integracoes', label: 'Integrações', icon: GitFork },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
    { id: 'seguranca', label: 'Segurança', icon: Shield },
  ]

  const integrations = [
    {
      name: 'GitHub',
      description: 'Sincronização de repositórios, PRs e commits.',
      icon: GitFork,
      connected: true,
    },
    {
      name: 'SonarQube',
      description: 'Análise de qualidade de código.',
      icon: Code2,
      connected: true,
    },
    {
      name: 'Slack',
      description: 'Notificações e alertas.',
      icon: Bell,
      connected: false,
    },
    {
      name: 'Jira',
      description: 'Issues, tarefas e sprints.',
      icon: Target,
      connected: false,
    },
  ]

  const notifications = [
    {
      key: 'deploy',
      label: 'Alertas de deploy',
      description: 'Receba aviso quando um deploy for concluído.',
    },
    {
      key: 'critical',
      label: 'Erros críticos',
      description: 'Alertas imediatos de falhas e pipelines.',
    },
    {
      key: 'security',
      label: 'Atualizações de segurança',
      description: 'Avisos de riscos e vulnerabilidades.',
    },
    {
      key: 'weekly',
      label: 'Resumo semanal',
      description: 'Relatório semanal de projetos e KPIs.',
    },
  ]

  const securityItems = [
    {
      title: 'Autenticação em dois fatores (2FA)',
      description: 'Adicione uma camada adicional de segurança.',
      icon: LockKeyhole,
      action: 'Ativar',
    },
    {
      title: 'Sessões ativas',
      description: 'Gerencie dispositivos conectados à conta.',
      icon: Shield,
      action: 'Ver 2 sessões',
    },
    {
      title: 'Alterar senha',
      description: 'Atualize sua senha periodicamente.',
      icon: LockKeyhole,
      action: 'Alterar',
    },
  ]

  return (
    <main className="dashboard-content">
      <div className="dashboard-intro">
        <div>
          <span className="eyebrow">ADMINISTRAÇÃO DO SISTEMA</span>
          <p>
            Personalize a plataforma, integre ferramentas e gerencie
            preferências.
          </p>
        </div>
      </div>

      <section className="panel elevation-1" style={{ marginBottom: '24px' }}>
        <div
          className="section-tabs"
          style={{
            padding: '0 16px',
            borderBottom: 'none',
          }}
        >
          <div>
            {tabs.map((item) => {
              const TabIcon = item.icon

              return (
                <button
                  key={item.id}
                  type="button"
                  className={tab === item.id ? 'active' : ''}
                  onClick={() => setTab(item.id)}
                >
                  <TabIcon size={16} />
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {tab === 'geral' && (
        <section className="panel elevation-1">
          <div className="panel-heading">
            <h2>Configurações Gerais</h2>
          </div>

          <div
            style={{
              display: 'grid',
              maxWidth: '620px',
              gap: '22px',
            }}
          >
            <label>
              <strong
                style={{
                  display: 'block',
                  marginBottom: '7px',
                  fontSize: '13px',
                }}
              >
                Nome da organização
              </strong>

              <div className="input-wrap">
                <BriefcaseBusiness size={17} />

                <input
                  value={draft.organizationName || ''}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      organizationName: event.target.value,
                    }))
                  }
                />
              </div>
            </label>

            <label>
              <strong
                style={{
                  display: 'block',
                  marginBottom: '7px',
                  fontSize: '13px',
                }}
              >
                Fuso horário
              </strong>

              <div className="input-wrap">
                <TimerReset size={17} />

                <select
                  value={draft.timezone || 'America/Sao_Paulo'}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      timezone: event.target.value,
                    }))
                  }
                  style={{
                    flex: 1,
                    border: 0,
                    outline: 0,
                    background: 'transparent',
                  }}
                >
                  <option value="America/Sao_Paulo">
                    Brasília (UTC-3)
                  </option>

                  <option value="America/New_York">
                    New York (UTC-5)
                  </option>

                  <option value="Europe/London">
                    London (UTC+0)
                  </option>
                </select>
              </div>
            </label>

            <div>
              <strong
                style={{
                  display: 'block',
                  marginBottom: '10px',
                  fontSize: '13px',
                }}
              >
                Tema
              </strong>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {[
                  ['Claro', Sparkles],
                  ['Escuro', Eye],
                  ['Sistema', Settings2],
                ].map(([theme, ThemeIcon]) => (
                  <button
                    key={theme}
                    type="button"
                    className={
                      draft.theme === theme
                        ? 'primary-button small'
                        : 'secondary-button small'
                    }
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        theme,
                      }))
                    }
                  >
                    <ThemeIcon size={14} />
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={save}
            >
              <Check size={16} />
              Salvar alterações
            </button>
          </div>
        </section>
      )}

      {tab === 'integracoes' && (
        <section className="panel elevation-1">
          <div className="panel-heading">
            <h2>Integrações</h2>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            {integrations.map((integration) => {
              const IntegrationIcon = integration.icon

              return (
                <article
                  key={integration.name}
                  className="metric-card elevation-1"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div className="metric-icon">
                    <IntegrationIcon size={18} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <h3>{integration.name}</h3>

                    <small
                      style={{
                        display: 'block',
                        marginTop: '4px',
                        color: 'var(--muted)',
                      }}
                    >
                      {integration.description}
                    </small>
                  </div>

                  <StatusBadge
                    status={integration.connected ? 'success' : 'warning'}
                  >
                    {integration.connected
                      ? 'Conectado'
                      : 'Desconectado'}
                  </StatusBadge>

                  <button
                    type="button"
                    className="secondary-button small"
                    onClick={() =>
                      onToast(
                        `${integration.name}: ação demonstrativa.`,
                      )
                    }
                  >
                    {integration.connected ? 'Configurar' : 'Conectar'}
                  </button>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {tab === 'notificacoes' && (
        <section className="panel elevation-1">
          <div className="panel-heading">
            <h2>Notificações</h2>
          </div>

          <div style={{ display: 'grid', gap: '10px' }}>
            {notifications.map((notification) => {
              const enabled = Boolean(
                draft.notifications?.[notification.key],
              )

              return (
                <article
                  key={notification.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '15px 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        display: 'block',
                        fontSize: '14px',
                      }}
                    >
                      {notification.label}
                    </h3>

                    <small style={{ color: 'var(--muted)' }}>
                      {notification.description}
                    </small>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleNotification(notification.key)}
                    aria-label={
                      enabled
                        ? `Desativar ${notification.label}`
                        : `Ativar ${notification.label}`
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: enabled ? 'flex-end' : 'flex-start',
                      width: '44px',
                      height: '24px',
                      padding: '3px',
                      border: 0,
                      borderRadius: '20px',
                      background: enabled
                        ? 'var(--color-primary-500)'
                        : 'var(--border)',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        width: '18px',
                        height: '18px',
                        background: '#fff',
                        borderRadius: '50%',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.16)',
                      }}
                    />
                  </button>
                </article>
              )
            })}
          </div>

          <button
            type="button"
            className="primary-button"
            style={{ marginTop: '20px' }}
            onClick={save}
          >
            <Check size={16} />
            Salvar preferências
          </button>
        </section>
      )}

      {tab === 'seguranca' && (
        <section className="panel elevation-1">
          <div className="panel-heading">
            <h2>Segurança e Autenticação</h2>
          </div>

          <div style={{ display: 'grid', gap: '14px' }}>
            {securityItems.map((item) => {
              const SecurityIcon = item.icon

              return (
                <article
                  key={item.title}
                  className="metric-card elevation-1"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div className="metric-icon">
                    <SecurityIcon size={18} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <h3>{item.title}</h3>

                    <small
                      style={{
                        display: 'block',
                        marginTop: '4px',
                        color: 'var(--muted)',
                      }}
                    >
                      {item.description}
                    </small>
                  </div>

                  <button
                    type="button"
                    className="secondary-button small"
                    onClick={() =>
                      onToast(`${item.action}: ação demonstrativa.`)
                    }
                  >
                    {item.action}
                  </button>
                </article>
              )
            })}
          </div>
        </section>
      )}
    </main>
  )
}