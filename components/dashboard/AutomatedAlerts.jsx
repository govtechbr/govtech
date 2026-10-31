import { AlertTriangle, Bell } from 'lucide-react'

import { COLORS } from '../../constants/colors'

const alerts = [
  {
    id: 1,
    type: 'warning',
    title: 'PR parada há 5 dias',
    message: '#842 · billing-orchestrator aguardando review',
    time: '2h atrás',
  },
  {
    id: 2,
    type: 'danger',
    title: 'Múltiplos commits sem CI',
    message: '#856 possui 3 commits sem checks aprovados',
    time: '4h atrás',
  },
  {
    id: 3,
    type: 'info',
    title: 'Meta semanal atingida',
    message: '12 Pull Requests integradas nesta semana. Meta: 10.',
    time: '6h atrás',
  },
]

export default function AutomatedAlerts() {
  const colorByType = {
    warning: COLORS.warning,
    danger: COLORS.danger,
    info: COLORS.info,
  }

  return (
    <section className="panel elevation-1">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">GITHUB ACTIONS</span>
          <h2>Alertas Automatizados</h2>
        </div>

        <Bell size={21} />
      </div>

      <div style={{ display: 'grid', gap: '12px' }}>
        {alerts.map((alert) => (
          <article
            key={alert.id}
            className="metric-card elevation-1"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              padding: '15px',
            }}
          >
            <AlertTriangle
              size={20}
              style={{
                color: colorByType[alert.type],
                flexShrink: 0,
              }}
            />

            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <strong style={{ fontSize: '14px' }}>{alert.title}</strong>

                <small style={{ color: 'var(--muted)' }}>{alert.time}</small>
              </div>

              <p
                style={{
                  marginTop: '5px',
                  color: 'var(--muted)',
                  fontSize: '13px',
                }}
              >
                {alert.message}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}