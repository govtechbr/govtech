import { useState } from 'react'
import {
  Bell,
  BriefcaseBusiness,
  Check,
  Eye,
  LockKeyhole,
  Settings2,
  Shield,
  Sparkles,
  TimerReset,
} from 'lucide-react'

import { useToast } from '@/shared/hooks/useToast'
import Select from '@/shared/ui/Select'

import styles from './SettingsPage.module.css'

const TIMEZONE_OPTIONS = [
  { value: 'America/Sao_Paulo', label: 'Brasília (UTC-3)' },
  { value: 'America/New_York', label: 'New York (UTC-5)' },
  { value: 'Europe/London', label: 'London (UTC+0)' },
]

function toDraft(settings) {
  return {
    organizationName: settings.organizationName,
    timezone: settings.timezone,
    theme: settings.theme,
    notifications: {
      ...settings.notifications,
    },
  }
}

export default function SettingsPage({ settings, onSaveSettings }) {
  const { showToast: onToast } = useToast()
  const [tab, setTab] = useState('geral')

  const [draft, setDraft] = useState(() => toDraft(settings))
  const [syncedSettings, setSyncedSettings] = useState(settings)

  // Reinicia o rascunho quando as configurações salvas mudam
  if (settings !== syncedSettings) {
    setSyncedSettings(settings)
    setDraft(toDraft(settings))
  }

  function save() {
    onSaveSettings(draft)
    onToast('Configurações salvas com sucesso.')
  }

  const tabs = [
    { id: 'geral', label: 'Geral', icon: Settings2 },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
    { id: 'seguranca', label: 'Segurança', icon: Shield },
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
          <p>Personalize a plataforma, integre ferramentas e gerencie preferências.</p>
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

            <Select
              label="Fuso horário"
              icon={TimerReset}
              options={TIMEZONE_OPTIONS}
              value={draft.timezone || 'America/Sao_Paulo'}
              onChange={(timezone) => setDraft((current) => ({ ...current, timezone }))}
            />

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
                      draft.theme === theme ? 'primary-button small' : 'secondary-button small'
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

            <button type="button" className="primary-button" onClick={save}>
              <Check size={16} />
              Salvar alterações
            </button>
          </div>
        </section>
      )}

      {tab === 'notificacoes' && (
        <section className="panel elevation-1">
          <div className="panel-heading">
            <div className={styles.heading}>
              <h2>Notificações</h2>
              <span className={styles.badge}>Em desenvolvimento</span>
            </div>
          </div>

          <p className={styles.notice}>
            As notificações ainda não estão disponíveis. As opções abaixo são apenas uma prévia.
          </p>

          <div className={styles.disabled} style={{ display: 'grid', gap: '10px' }}>
            {notifications.map((notification) => {
              const enabled = Boolean(draft.notifications?.[notification.key])

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

                    <small style={{ color: 'var(--muted)' }}>{notification.description}</small>
                  </div>

                  <button
                    type="button"
                    disabled
                    aria-label={
                      enabled ? `Desativar ${notification.label}` : `Ativar ${notification.label}`
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
                      background: enabled ? 'var(--color-primary-500)' : 'var(--border)',
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
        </section>
      )}

      {tab === 'seguranca' && (
        <section className="panel elevation-1">
          <div className="panel-heading">
            <div className={styles.heading}>
              <h2>Segurança e Autenticação</h2>
              <span className={styles.badge}>Em desenvolvimento</span>
            </div>
          </div>

          <p className={styles.notice}>
            Os recursos de segurança da conta ainda não estão disponíveis. Os itens abaixo são
            apenas uma prévia.
          </p>

          <div className={styles.disabled} style={{ display: 'grid', gap: '14px' }}>
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

                  <button type="button" className="secondary-button small" disabled>
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
