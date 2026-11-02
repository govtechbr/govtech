import { formatDateTime, formatDuration } from '@/shared/lib/date'
import Tooltip from '@/shared/ui/Tooltip'
import styles from './CiHistoryPanel.module.css'

const VISIBLE = 5

// Histórico do CI (regra G11). metrics: ciRunSuccessRate e ciRecoveryHours de
// governanceMetrics; incidents: ciIncidents (uma falha por sequência de execuções)
export default function CiHistoryPanel({ metrics, incidents, days, hasRuns }) {
  return (
    <section className="panel elevation-1">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">CI · {days} DIAS</span>
          <h2>Histórico do CI</h2>
        </div>

        <Tooltip label="Como o histórico do CI é calculado">
          <p>
            Execuções do GitHub Actions guardadas a cada sincronização (90 dias). Sucesso: % das
            concluídas que passaram, sem contar canceladas. Correção: do fim da primeira execução
            que falhou ao fim da próxima que passou, no mesmo workflow e branch.
          </p>
        </Tooltip>
      </div>

      {!hasRuns ? (
        <p className={styles.muted}>
          Nenhuma execução do GitHub Actions sincronizada. Confira se a chave tem a permissão
          Actions (Read).
        </p>
      ) : (
        <>
          <div className={`repo-stats ${styles.stats}`}>
            <div>
              <span>
                {metrics.ciRunSuccessRate === null ? '—' : `${metrics.ciRunSuccessRate}%`}
              </span>
              <small>Execuções com sucesso</small>
            </div>

            <div>
              <span>{formatDuration(metrics.ciRecoveryHours)}</span>
              <small>Tempo médio de correção</small>
            </div>

            <div>
              <span>{incidents.length}</span>
              <small>Falhas no período</small>
            </div>
          </div>

          {incidents.length === 0 ? (
            <p className={styles.muted}>Nenhuma falha do CI no período.</p>
          ) : (
            <ul className={styles.list}>
              {incidents.slice(0, VISIBLE).map((incident) => (
                <li key={incident.id} className={styles.item}>
                  <a href={incident.href} target="_blank" rel="noreferrer">
                    Execução #{incident.runNumber} · {incident.workflow}
                  </a>
                  <small className={styles.muted}>
                    {incident.repositoryName} · {incident.branch} ·{' '}
                    {formatDateTime(incident.startedAt)}
                    {incident.failedRuns > 1 && ` · ${incident.failedRuns} execuções falharam`}
                  </small>
                  <strong
                    className={incident.recoveryHours === null ? styles.failing : styles.fixed}
                  >
                    {incident.recoveryHours === null
                      ? 'Ainda falhando'
                      : `Corrigida em ${formatDuration(incident.recoveryHours)}`}
                  </strong>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
