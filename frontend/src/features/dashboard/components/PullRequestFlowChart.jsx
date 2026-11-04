import styles from '@/features/dashboard/OverviewPage.module.css'

// weeks: [{ label, opened, merged }], da semana mais antiga à atual (weeklyFlow)
export default function PullRequestFlowChart({ weeks }) {
  const max = Math.max(1, ...weeks.flatMap((week) => [week.opened, week.merged]))
  const current = weeks.at(-1)
  const summary = weeks
    .map((week) => `Semana de ${week.label}: ${week.opened} criados, ${week.merged} mergeados`)
    .join('; ')

  // Altura da barra = dado; vai por variável CSS, o resto do estilo fica no módulo
  const size = (value) => ({ '--size': `${(value / max) * 100}%` })

  return (
    <div>
      <div className={styles.legend}>
        <span className={`${styles.legendItem} ${styles.opened}`}>PRs criados</span>
        <span className={`${styles.legendItem} ${styles.merged}`}>PRs mergeados</span>
      </div>

      <div className={styles.bars} role="img" aria-label={summary}>
        {weeks.map((week) => (
          <div key={week.label} className={styles.week}>
            <div className={styles.weekBars}>
              <span
                className={`${styles.bar} ${styles.opened}`}
                style={size(week.opened)}
                title={`${week.opened} criados`}
              />
              <span
                className={`${styles.bar} ${styles.merged}`}
                style={size(week.merged)}
                title={`${week.merged} mergeados`}
              />
            </div>

            <small className={styles.weekLabel}>{week.label}</small>
          </div>
        ))}
      </div>

      <p className={styles.muted}>
        Períodos de 7 dias. Nesta semana: <strong>{current.opened} criados</strong> e{' '}
        <strong>{current.merged} mergeados</strong>.
      </p>
    </div>
  )
}
