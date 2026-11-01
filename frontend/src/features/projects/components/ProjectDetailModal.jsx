import { Edit3, Server, Trash2 } from 'lucide-react'

import { formatProjectDate, getProjectStatus } from '@/shared/lib/projectUtils'
import Modal from '@/shared/ui/Modal'
import StatusBadge from '@/shared/ui/StatusBadge'
import styles from './ProjectModals.module.css'

export default function ProjectDetailModal({ project, onClose, onEdit, onDelete }) {
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

      <div className={styles.section}>
        <strong className={styles.sectionTitle}>Repositórios vinculados</strong>

        {project.repositories.length > 0 ? (
          <ul className={styles.repoList}>
            {project.repositories.map((repository) => (
              <li key={repository} className={styles.repoTag}>
                <Server size={13} />
                {repository}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.muted}>Nenhum repositório vinculado.</p>
        )}
      </div>

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
