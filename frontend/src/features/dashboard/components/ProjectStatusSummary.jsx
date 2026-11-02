import { AlertTriangle, Check, Info } from 'lucide-react'

import styles from '@/features/dashboard/OverviewPage.module.css'
import { PROJECT_STATUS } from '@/shared/constants/projectStatus'

const overallByStatus = {
  success: {
    icon: Check,
    title: 'Todos os projetos saudáveis',
    message: 'Nenhum alerta ativo nos projetos monitorados.',
  },
  warning: {
    icon: AlertTriangle,
    title: 'Atenção necessária',
    message: 'Há projetos com alertas de atenção. Veja a lista de alertas abaixo.',
  },
  danger: {
    icon: AlertTriangle,
    title: 'Projetos em risco',
    message: 'Há projetos com alertas de risco que pedem ação.',
  },
}

// health: { [projectId]: { status, alerts } }, calculado de governanceAlerts (regra P3)
export default function ProjectStatusSummary({ health }) {
  const statuses = Object.values(health).map(({ status }) => status)
  const counts = Object.fromEntries(
    Object.keys(PROJECT_STATUS).map((status) => [
      status,
      statuses.filter((item) => item === status).length,
    ]),
  )
  const overallStatus = counts.danger > 0 ? 'danger' : counts.warning > 0 ? 'warning' : 'success'
  const overall = overallByStatus[overallStatus]
  const OverallIcon = overall.icon

  return (
    <section className={`panel elevation-1 ${styles.summary}`}>
      <div className="panel-heading">
        <div>
          <span className="section-kicker">VISÃO DE NEGÓCIO · PADRÃO SEMÁFORO</span>
          <h2>Status dos Projetos</h2>
        </div>
      </div>

      <div className={`${styles.overall} ${styles[overallStatus]}`}>
        <span className={styles.overallIcon} aria-hidden="true">
          <OverallIcon size={22} />
        </span>

        <div>
          <strong className={styles.overallTitle}>{overall.title}</strong>
          <p className={styles.muted}>{overall.message}</p>
        </div>
      </div>

      <ul className={styles.counts}>
        {Object.entries(PROJECT_STATUS).map(([status, label]) => (
          <li key={status} className={`${styles.count} ${styles[status]}`}>
            <strong>{counts[status]}</strong>
            <small>{label}</small>
          </li>
        ))}
      </ul>

      {/* Regra P4: a tela explica de onde vem o status */}
      <div className={styles.ruleCard} role="note" aria-labelledby="status-rule-title">
        <Info size={16} aria-hidden="true" />

        <div>
          <strong id="status-rule-title">Como o status é calculado</strong>
          <p>
            O status vem dos alertas automáticos de cada projeto: <b>Risco</b> se houver algum
            alerta de risco; senão <b>Atenção</b> se houver algum alerta de atenção; senão{' '}
            <b>Saudável</b>.
          </p>
          <ul>
            <li>
              PR aberto há mais de 1 dia: atenção; há mais de 3 dias: risco (rascunhos não contam)
            </li>
            <li>PR mergeado sem nenhuma aprovação nos últimos 30 dias: atenção</li>
            <li>Branch principal sem proteção: atenção</li>
            <li>Prazo do projeto em até 7 dias: atenção; vencido: risco</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
