import { Edit3, Server, Trash2, X } from 'lucide-react'

import StatusBadge from '../common/StatusBadge'
import {
  formatProjectDate,
  getProjectStatus,
} from '../../utils/projectUtils'

export default function ProjectDetailModal({
  project,
  onClose,
  onEdit,
  onDelete,
}) {
  const status = getProjectStatus(project)

  return (
    <div className="detail-popover" style={{ maxWidth: '560px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <span className="section-kicker">DETALHES DO PROJETO</span>
          <h3>{project.name}</h3>
        </div>

        <button className="icon-button" onClick={onClose}>
          <X size={17} />
        </button>
      </div>

      <p
        style={{
          color: 'var(--muted)',
          fontSize: '14px',
          lineHeight: 1.6,
        }}
      >
        {project.description}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginTop: '20px',
        }}
      >
        <div>
          <small style={{ color: 'var(--muted)' }}>Deadline</small>
          <strong style={{ display: 'block', marginTop: '4px' }}>
            {formatProjectDate(project.deadline)}
          </strong>

          <small style={{ color: status.color }}>{status.message}</small>
        </div>

        <div>
          <small style={{ color: 'var(--muted)' }}>Status</small>

          <div style={{ marginTop: '6px' }}>
            <StatusBadge status={status.key}>
              {status.icon} {status.label}
            </StatusBadge>
          </div>
        </div>

        <div>
          <small style={{ color: 'var(--muted)' }}>Responsável</small>
          <strong style={{ display: 'block', marginTop: '4px' }}>
            {project.owner}
          </strong>
        </div>

        <div>
          <small style={{ color: 'var(--muted)' }}>Progresso</small>
          <strong style={{ display: 'block', marginTop: '4px' }}>
            {project.progress}%
          </strong>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <strong style={{ fontSize: '13px' }}>Repositórios vinculados</strong>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '7px',
            marginTop: '10px',
          }}
        >
          {project.repositories.length > 0 ? (
            project.repositories.map((repository) => (
              <span
                key={repository}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 9px',
                  borderRadius: '6px',
                  background: 'var(--bg-alt)',
                  fontSize: '12px',
                }}
              >
                <Server size={13} />
                {repository}
              </span>
            ))
          ) : (
            <small style={{ color: 'var(--muted)' }}>
              Nenhum repositório vinculado.
            </small>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          marginTop: '24px',
        }}
      >
        <button className="primary-button small" onClick={onEdit}>
          <Edit3 size={14} />
          Editar
        </button>

        <button
          className="secondary-button small"
          onClick={onDelete}
          style={{ color: 'var(--color-danger)' }}
        >
          <Trash2 size={14} />
          Excluir
        </button>

        <button className="secondary-button small" onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  )
}