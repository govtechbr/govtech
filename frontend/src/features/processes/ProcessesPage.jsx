import { Info } from 'lucide-react'

import { SCORE_BANDS, scoreBand } from '@/shared/lib/governanceScore'
import { PROCESS_AREAS, areaCriteria, areaScore } from '@/shared/lib/processes'
import styles from './ProcessesPage.module.css'

// Evidências por área de processo (docs/REGRAS_DE_NEGOCIO.md §11). components vem do
// Índice de Governança da empresa (adaptador em app/routes.jsx); aqui só se organiza.
export default function ProcessesPage({ components = {}, isLoading = false }) {
  return (
    <section className="dashboard-content">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">PROCESSOS E EVIDÊNCIAS</span>

          <p>
            Os registros dos Pull Requests organizados pelas áreas de processo do CMMI-DEV 1.3 e
            pelos processos da ISO/IEC/IEEE 12207, base do SPICE (ISO/IEC 33000).
          </p>
        </div>
      </div>

      <p className={styles.notice} role="note">
        <Info size={18} aria-hidden="true" />
        <span>
          Estas notas são <strong>evidências de apoio</strong>. Isto não é uma avaliação formal de
          maturidade: atribuir nível de capacidade exige um avaliador qualificado.
        </span>
      </p>

      {isLoading && <p className={styles.feedback}>Carregando evidências…</p>}

      <div className={styles.grid} aria-busy={isLoading}>
        {PROCESS_AREAS.map((area) => {
          const score = areaScore(area, components)
          const band = scoreBand(score)

          return (
            <article className={`${styles.card} ${band ? styles[band] : ''}`} key={area.key}>
              <header className={styles.header}>
                <div>
                  <h2 className={styles.title}>{`${area.name} (${area.code})`}</h2>
                  <p className={styles.iso}>ISO/IEC/IEEE 12207: {area.iso}</p>
                </div>

                {score === null ? (
                  <p className={styles.noScore}>Sem dados</p>
                ) : (
                  <p className={styles.score}>
                    <strong className={styles.scoreValue}>{score}</strong>
                    <span className={styles.scoreMax}>/100</span>
                    <span className={styles.band}>{SCORE_BANDS[band]}</span>
                  </p>
                )}
              </header>

              <dl className={styles.facts}>
                <div>
                  <dt>Prática do modelo</dt>
                  <dd>{area.practice}</dd>
                </div>

                <div>
                  <dt>De onde vem a evidência</dt>
                  <dd>{area.source}</dd>
                </div>
              </dl>

              <ul className={styles.criteria} aria-label={`Critérios de ${area.name}`}>
                {areaCriteria(area, components).map((criterion) => (
                  <li key={criterion.key}>
                    <span>{criterion.label}</span>
                    <span className={styles.criterionScore}>
                      {criterion.score === null ? 'sem dado' : `${criterion.score}`}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          )
        })}
      </div>
    </section>
  )
}
