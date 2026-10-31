import { AlertTriangle, Check } from 'lucide-react'

import { COLORS } from '../../constants/colors'
import { getProjectStatus } from '../../utils/projectUtils'

function SummaryCount({ value, label, color, background, border }) {
  return (
    <div
      style={{
        padding: '12px',
        border: `1px solid ${border}`,
        borderRadius: '8px',
        background,
        textAlign: 'center',
      }}
    >
      <strong
        style={{
          display: 'block',
          color,
          fontSize: '24px',
        }}
      >
        {value}
      </strong>

      <small style={{ color: 'var(--muted)' }}>{label}</small>
    </div>
  )
}

export default function ProjectStatusSummary({ projectList = [] }) {
  const safeProjects = Array.isArray(projectList) ? projectList : []

  const projectsWithStatus = safeProjects.map((project) => ({
    project,
    status: getProjectStatus(project),
  }))

  const counts = {
    onTrack: projectsWithStatus.filter(
      ({ status }) => status.semanticKey === 'on_track'
    ).length,
    atRisk: projectsWithStatus.filter(
      ({ status }) => status.semanticKey === 'at_risk'
    ).length,
    delayed: projectsWithStatus.filter(
      ({ status }) => status.semanticKey === 'delayed'
    ).length,
  }

  let overall = {
    label: 'Dentro do prazo',
    color: COLORS.success,
    background: COLORS.successLight,
    border: COLORS.successBorder,
    icon: Check,
    message: 'Todos os projetos estão dentro do cronograma definido.',
  }

  if (counts.delayed > 0) {
    overall = {
      label: 'Fora do prazo',
      color: COLORS.danger,
      background: COLORS.dangerLight,
      border: COLORS.dangerBorder,
      icon: AlertTriangle,
      message: 'Existem projetos atrasados que exigem ação corretiva.',
    }
  } else if (counts.atRisk > 0) {
    overall = {
      label: 'Atenção necessária',
      color: COLORS.warning,
      background: COLORS.warningLight,
      border: COLORS.warningBorder,
      icon: AlertTriangle,
      message: 'Existem projetos próximos da deadline.',
    }
  }

  const OverallIcon = overall.icon

  return (
    <section className="panel elevation-1" style={{ marginBottom: '24px' }}>
      <div className="panel-heading">
        <div>
          <span className="section-kicker">
            VISÃO DE NEGÓCIO · PADRÃO SEMÁFORO
          </span>

          <h2>Status dos Projetos</h2>
        </div>

        <OverallIcon size={24} style={{ color: overall.color }} />
      </div>

      <div
        style={{
          padding: '22px',
          border: `1px solid ${overall.border}`,
          borderRadius: '12px',
          background: overall.background,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <span
            style={{
              display: 'grid',
              width: '48px',
              height: '48px',
              flexShrink: 0,
              borderRadius: '50%',
              placeItems: 'center',
              background: overall.color,
            }}
          >
            <OverallIcon size={24} color="#fff" />
          </span>

          <div>
            <strong
              style={{
                display: 'block',
                color: overall.color,
                fontSize: '20px',
              }}
            >
              {overall.label}
            </strong>

            <p
              style={{
                marginTop: '5px',
                color: 'var(--muted)',
                fontSize: '14px',
              }}
            >
              {overall.message}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '12px',
            marginTop: '20px',
          }}
        >
          <SummaryCount
            value={counts.onTrack}
            label="🟢 NO PRAZO"
            color={COLORS.success}
            background={COLORS.successLight}
            border={COLORS.successBorder}
          />

          <SummaryCount
            value={counts.atRisk}
            label="🟡 ATENÇÃO"
            color={COLORS.warning}
            background={COLORS.warningLight}
            border={COLORS.warningBorder}
          />

          <SummaryCount
            value={counts.delayed}
            label="🔴 ATRASADO"
            color={COLORS.danger}
            background={COLORS.dangerLight}
            border={COLORS.dangerBorder}
          />
        </div>
      </div>
    </section>
  )
}