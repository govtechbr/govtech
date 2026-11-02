import { Edit3, Trash2 } from 'lucide-react'

import GitHubPanel from '@/features/projects/components/GitHubPanel'
import { PROJECT_STATUS } from '@/shared/constants/projectStatus'
import { formatDay } from '@/shared/lib/date'
import { SCORE_BANDS, scoreBand } from '@/shared/lib/governanceScore'
import { formatProjectDate } from '@/shared/lib/projectUtils'
import Modal from '@/shared/ui/Modal'
import ScoreBreakdown from '@/shared/ui/ScoreBreakdown'
import StatusBadge from '@/shared/ui/StatusBadge'
import styles from './ProjectModals.module.css'

// github: { canManage, canSync }, conforme o papel (ver app/routes.jsx)
// health: { status, alerts } calculado pelos alertas (regra P3); aqui só o status aparece
// score: linha mais recente do Índice de Governança, ou null se ainda não apurado
export default function ProjectDetailModal({
  project,
  health,
  score = null,
  github,
  onClose,
  onEdit,
  onDelete,
}) {
  return (
    <Modal title={project.name} kicker="DETALHES DO PROJETO" onClose={onClose}>
      <p className={styles.description}>{project.description}</p>

      <dl className={styles.facts}>
        <div className={styles.fact}>
          <dt>Deadline</dt>
          <dd>{formatProjectDate(project.deadline)}</dd>
        </div>

        <div className={styles.fact}>
          <dt>Status</dt>
          <dd>
            <StatusBadge status={health.status}>{PROJECT_STATUS[health.status]}</StatusBadge>
          </dd>
        </div>

        <div className={styles.fact}>
          <dt>Responsável</dt>
          <dd>{project.owner}</dd>
        </div>
      </dl>

      <section className={styles.section} aria-labelledby="project-index-title">
        <h3 id="project-index-title" className={styles.sectionTitle}>
          Índice de Governança
        </h3>

        {score === null ? (
          <p className={styles.deadlineMessage}>
            Ainda não apurado: a apuração roda junto da sincronização, a cada hora.
          </p>
        ) : (
          <>
            <p className={styles.index}>
              <strong>{score.score ?? '—'}</strong>/100
              {score.score !== null && (
                <StatusBadge status={scoreBand(score.score)}>
                  {SCORE_BANDS[scoreBand(score.score)]}
                </StatusBadge>
              )}
              <span className={styles.deadlineMessage}>em {formatDay(score.day)}</span>
            </p>
            <ScoreBreakdown components={score.components} />
          </>
        )}
      </section>

      <section className={styles.section} aria-labelledby="project-github-title">
        <h3 id="project-github-title" className={styles.sectionTitle}>
          GitHub
        </h3>

        <GitHubPanel projectId={project.id} canManage={github.canManage} canSync={github.canSync} />
      </section>

      {(onEdit || onDelete) && (
        <div className={styles.actions}>
          {onEdit && (
            <button type="button" className="primary-button small" onClick={onEdit}>
              <Edit3 size={14} />
              Editar
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              className={`secondary-button small ${styles.dangerText}`}
              onClick={onDelete}
            >
              <Trash2 size={14} />
              Excluir
            </button>
          )}
        </div>
      )}
    </Modal>
  )
}
