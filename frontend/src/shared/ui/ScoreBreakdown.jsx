import { SCORE_CRITERIA } from '@/shared/lib/governanceScore'
import styles from './ScoreBreakdown.module.css'

// Nota de cada critério do Índice de Governança (regra I1), com o peso.
// components: { review, flow, deadline, protection, leadTime }, 0–100 ou null
export default function ScoreBreakdown({ components }) {
  return (
    <ul className={styles.list}>
      {SCORE_CRITERIA.map(({ key, label, weight }) => {
        const value = components[key]

        return (
          <li key={key} className={styles.item}>
            <span className={styles.label}>
              {label} <small>peso {weight}</small>
            </span>
            <strong className={styles.value}>{value === null ? 'sem dados' : value}</strong>
            {/* A barra só repete o número ao lado; leitor de tela lê o texto */}
            <span className={styles.track} aria-hidden="true">
              {value !== null && <span className={styles.bar} style={{ '--size': `${value}%` }} />}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
