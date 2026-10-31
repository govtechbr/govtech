import { COLORS } from '../../constants/colors'

export default function PullRequestDistribution({
  open = 2,
  inReview = 2,
  approved = 1,
  merged = 2,
}) {
  const values = [
    {
      label: 'Abertas',
      value: Number(open) || 0,
      color: COLORS.info,
      description: 'Aguardando início do fluxo',
    },
    {
      label: 'Em review',
      value: Number(inReview) || 0,
      color: COLORS.warning,
      description: 'Dependem de revisão',
    },
    {
      label: 'Aprovadas',
      value: Number(approved) || 0,
      color: COLORS.purple,
      description: 'Prontas para integração',
    },
    {
      label: 'Integradas',
      value: Number(merged) || 0,
      color: COLORS.success,
      description: 'Entregas concluídas',
    },
  ]

  const total = values.reduce((accumulator, item) => {
    return accumulator + item.value
  }, 0)

  return (
    <div
      style={{
        paddingLeft: '24px',
        borderLeft: '1px solid var(--border)',
      }}
    >
      <small className="section-kicker">DISTRIBUIÇÃO ATUAL</small>

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '8px',
          margin: '6px 0 16px',
        }}
      >
        <strong style={{ fontSize: '32px' }}>{total}</strong>

        <span style={{ color: 'var(--muted)', fontSize: '13px' }}>
          Pull Requests
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          height: '10px',
          overflow: 'hidden',
          marginBottom: '18px',
          borderRadius: '10px',
          background: 'var(--border)',
        }}
      >
        {values.map((item) => (
          <span
            key={item.label}
            style={{
              width: total > 0 ? `${(item.value / total) * 100}%` : '0%',
              minWidth: item.value > 0 ? '4px' : 0,
              background: item.color,
            }}
          />
        ))}
      </div>

      <div style={{ display: 'grid', gap: '12px' }}>
        {values.map((item) => {
          const percentage =
            total > 0 ? Math.round((item.value / total) * 100) : 0

          return (
            <div
              key={item.label}
              style={{
                display: 'grid',
                gridTemplateColumns: '12px 1fr auto',
                alignItems: 'center',
                gap: '9px',
              }}
            >
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: item.color,
                }}
              />

              <div>
                <strong style={{ display: 'block', fontSize: '13px' }}>
                  {item.label}
                </strong>

                <small style={{ color: 'var(--muted)', fontSize: '11px' }}>
                  {item.description}
                </small>
              </div>

              <strong style={{ fontSize: '13px' }}>
                {item.value} · {percentage}%
              </strong>
            </div>
          )
        })}
      </div>
    </div>
  )
}