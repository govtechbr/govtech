import { AlertTriangle, Bell } from 'lucide-react'
import { useState } from 'react'

import styles from '@/features/dashboard/OverviewPage.module.css'
import { PROJECT_STATUS } from '@/shared/constants/projectStatus'

const VISIBLE = 8

// alerts: governanceAlerts (§6), os mais críticos primeiro
export default function AutomatedAlerts({ alerts }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? alerts : alerts.slice(0, VISIBLE)

  return (
    <section className="panel elevation-1">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">GOVERNANÇA</span>
          <h2>Alertas Automatizados</h2>
        </div>

        <Bell size={21} />
      </div>

      {alerts.length === 0 ? (
        <p className={styles.muted}>Nenhum alerta ativo.</p>
      ) : (
        <ul className={styles.alertList}>
          {visible.map((alert) => (
            <li key={alert.id} className={`elevation-1 ${styles.alert} ${styles[alert.level]}`}>
              <AlertTriangle size={18} className={styles.alertIcon} aria-hidden="true" />

              <div>
                <strong>
                  {PROJECT_STATUS[alert.level]}: {alert.title}
                </strong>

                {alert.href ? (
                  <a
                    className={styles.alertDetail}
                    href={alert.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {alert.detail}
                  </a>
                ) : (
                  <span className={styles.alertDetail}>{alert.detail}</span>
                )}

                <p className={styles.alertReason}>{alert.reason}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {alerts.length > VISIBLE && (
        <button
          className={`secondary-button ${styles.alertToggle}`}
          type="button"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? 'Mostrar menos' : `Ver todos os ${alerts.length} alertas`}
        </button>
      )}
    </section>
  )
}
