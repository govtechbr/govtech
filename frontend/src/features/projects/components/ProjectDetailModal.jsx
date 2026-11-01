import { Edit3, Trash2 } from 'lucide-react'

import GitHubPanel from '@/features/projects/components/GitHubPanel'
import { formatProjectDate, getProjectStatus } from '@/shared/lib/projectUtils'
import Modal from '@/shared/ui/Modal'
import StatusBadge from '@/shared/ui/StatusBadge'
import styles from './ProjectModals.module.css'

// github: { canManage, canSync }, conforme o papel (ver app/routes.jsx)
export default function ProjectDetailModal({ project, github, onClose, onEdit, onDelete }) {
  const status = getProjectStatus(project)

  return (
    <Modal title={project.name} kicker="DETALHES DO PROJETO" onClose={onClose}>
      <p className={styles.description}>{project.description}</p>

      <dl className={styles.facts}>
        <div className={styles.fact}>
          <dt>Deadline</dt>
          <dd>
            {formatProjectDate(project.deadline)}
            <span className={`${styles.deadlineMessage} ${styles[status.key]}`}>
              {status.message}
            </span>
          </dd>
        </div>

        <div className={styles.fact}>
          <dt>Status</dt>
          <dd>
            <StatusBadge status={status.key}>
              {status.icon} {status.label}
            </StatusBadge>
          </dd>
        </div>

        <div className={styles.fact}>
          <dt>Responsável</dt>
          <dd>{project.owner}</dd>
        </div>

        <div className={styles.fact}>
          <dt>Progresso</dt>
          <dd>{project.progress}%</dd>
        </div>
      </dl>

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
