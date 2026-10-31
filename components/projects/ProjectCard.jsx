import StatusBadge from '../common/StatusBadge'
import {
  formatProjectDate,
  getProjectStatus,
} from '../../utils/projectUtils'

export default function ProjectCard({ project, onClick }) {
  const status = getProjectStatus(project)

  return (
    <article
      className="metric-card elevation-1"
      onClick={onClick}
      style={{
        display: 'block',
        cursor: 'pointer',
        borderTop: 'none',
        borderLeft: `4px solid ${status.color}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px',
          marginBottom: '13px',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '19px' }}>{status.icon}</span>
            <strong style={{ fontSize: '16px' }}>{project.name}</strong>
          </div>

          <p
            style={{
              margin: 0,
              color: 'var(--muted)',
              fontSize: '13px',
              lineHeight: 1.5,
            }}
          >
            {project.description}
          </p>
        </div>

        <StatusBadge status={status.key}>{status.label}</StatusBadge>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '6px',
            fontSize: '13px',
          }}
        >
          <span style={{ color: 'var(--muted)' }}>Progresso</span>
          <strong>{project.progress}%</strong>
        </div>

        <div
          style={{
            height: '7px',
            overflow: 'hidden',
            borderRadius: '10px',
            background: 'var(--border)',
          }}
        >
          <div
            style={{
              width: `${project.progress}%`,
              height: '100%',
              borderRadius: '10px',
              background: status.color,
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          fontSize: '12px',
        }}
      >
        <div>
          <small style={{ color: 'var(--muted)' }}>Deadline</small>
          <strong style={{ display: 'block', marginTop: '3px' }}>
            {formatProjectDate(project.deadline)}
          </strong>
        </div>

        <div>
          <small style={{ color: 'var(--muted)' }}>Responsável</small>
          <strong style={{ display: 'block', marginTop: '3px' }}>
            {project.owner}
          </strong>
        </div>

        <div>
          <small style={{ color: 'var(--muted)' }}>Prioridade</small>
          <strong style={{ display: 'block', marginTop: '3px' }}>
            {project.priority === 'high' && '🔴 Alta'}
            {project.priority === 'medium' && '🟡 Média'}
            {project.priority === 'low' && '🟢 Baixa'}
          </strong>
        </div>

        <div>
          <small style={{ color: 'var(--muted)' }}>Repositórios</small>
          <strong style={{ display: 'block', marginTop: '3px' }}>
            {project.repositories.length}
          </strong>
        </div>
      </div>
    </article>
  )
}