import { COLORS } from '../../constants/colors'

const weeklyFlow = [
  { week: 'Sem. 1', created: 10, merged: 7, closed: 1 },
  { week: 'Sem. 2', created: 14, merged: 9, closed: 2 },
  { week: 'Sem. 3', created: 12, merged: 11, closed: 1 },
  { week: 'Sem. 4', created: 16, merged: 12, closed: 2 },
]

export default function PullRequestFlowChart({ data = weeklyFlow }) {
  const safeData = Array.isArray(data) && data.length > 0 ? data : weeklyFlow

  const maxValue = Math.max(
    ...safeData.flatMap((week) => [
      week.created || 0,
      week.merged || 0,
      week.closed || 0,
    ])
  )

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '16px',
          color: 'var(--muted)',
          fontSize: '12px',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <i
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '3px',
              background: COLORS.info,
            }}
          />
          PRs criadas
        </span>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <i
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '3px',
              background: COLORS.success,
            }}
          />
          PRs integradas
        </span>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <i
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '3px',
              background: COLORS.warning,
            }}
          />
          PRs fechadas
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '18px',
          height: '210px',
          padding: '16px 8px 0',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {safeData.map((week) => {
          const createdHeight = ((week.created || 0) / maxValue) * 150
          const mergedHeight = ((week.merged || 0) / maxValue) * 150
          const closedHeight = ((week.closed || 0) / maxValue) * 150

          return (
            <div
              key={week.week}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                gap: '5px',
                minWidth: '55px',
                flex: 1,
                height: '100%',
                paddingBottom: '30px',
              }}
            >
              <span
                title={`${week.created} Pull Requests criadas`}
                style={{
                  width: '22%',
                  minWidth: '10px',
                  height: `${createdHeight}px`,
                  borderRadius: '5px 5px 0 0',
                  background: COLORS.info,
                }}
              />

              <span
                title={`${week.merged} Pull Requests integradas`}
                style={{
                  width: '22%',
                  minWidth: '10px',
                  height: `${mergedHeight}px`,
                  borderRadius: '5px 5px 0 0',
                  background: COLORS.success,
                }}
              />

              <span
                title={`${week.closed} Pull Requests fechadas`}
                style={{
                  width: '22%',
                  minWidth: '10px',
                  height: `${closedHeight}px`,
                  borderRadius: '5px 5px 0 0',
                  background: COLORS.warning,
                }}
              />

              <small
                style={{
                  position: 'absolute',
                  right: 0,
                  bottom: '7px',
                  left: 0,
                  color: 'var(--muted)',
                  fontSize: '11px',
                  textAlign: 'center',
                }}
              >
                {week.week}
              </small>
            </div>
          )
        })}
      </div>

      <p
        style={{
          marginTop: '12px',
          color: 'var(--muted)',
          fontSize: '12px',
        }}
      >
        A última semana registrou <strong>16 PRs criadas</strong> e{' '}
        <strong>12 integradas</strong>.
      </p>
    </div>
  )
}