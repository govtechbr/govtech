import { useState } from 'react'

import styles from '../StrategyPage.module.css'

const VISIBLE = 3

// Alertas de um projeto vinculado ao objetivo: só os mais críticos na primeira
// visão (a lista já chega ordenada, §6), o resto sob demanda.
export default function ProjectAlerts({ alerts }) {
  const [expanded, setExpanded] = useState(false)

  if (alerts.length === 0) return <p className={styles.noAlerts}>Sem alertas.</p>

  const visible = expanded ? alerts : alerts.slice(0, VISIBLE)

  return (
    <>
      <ul className={styles.alertList}>
        {visible.map((alert) => (
          <li key={alert.id}>
            <span className={styles.alertTitle}>{alert.title}</span>
            <span className={styles.alertDetail}>{alert.detail}</span>
          </li>
        ))}
      </ul>

      {alerts.length > VISIBLE && (
        <button
          type="button"
          className={`secondary-button ${styles.alertToggle}`}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? 'Mostrar menos' : `Ver todos os ${alerts.length} alertas`}
        </button>
      )}
    </>
  )
}
