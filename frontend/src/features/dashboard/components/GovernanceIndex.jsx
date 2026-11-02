import { useState } from 'react'
import { AlertTriangle, Check, Info } from 'lucide-react'

import styles from '@/features/dashboard/components/GovernanceIndex.module.css'
import { formatDay, formatTime } from '@/shared/lib/date'
import { SCORE_BANDS, scoreBand, scoreChange, scoreHistory } from '@/shared/lib/governanceScore'
import ScoreBreakdown from '@/shared/ui/ScoreBreakdown'
import StatusBadge from '@/shared/ui/StatusBadge'

const DAY = 24 * 60 * 60 * 1000
const CHART_DAYS = 30
const CHANGE_DAYS = 7
// Coordenadas do SVG: x de 0 a 100 (dias), y de 0 a 100 (nota invertida)
const bandIcons = { success: Check, warning: AlertTriangle, danger: AlertTriangle }

function dayIndex(day, firstDay) {
  return Math.round((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${firstDay}T00:00:00Z`)) / DAY)
}

function linePath(points) {
  return points.map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'}${x} ${y}`).join(' ')
}

function changeText(change) {
  if (change === null) return `Histórico de menos de ${CHANGE_DAYS} dias`
  if (change === 0) return `Estável em ${CHANGE_DAYS} dias`

  const points = Math.abs(change)
  return `${change > 0 ? '▲' : '▼'} ${points} ${points === 1 ? 'ponto' : 'pontos'} em ${CHANGE_DAYS} dias`
}

// Linha da nota da empresa nos últimos 30 dias, com cursor e tooltip por dia
function ScoreChart({ history }) {
  const [active, setActive] = useState(null)
  const lastDay = history.at(-1).day
  const firstDay = new Date(Date.parse(`${lastDay}T00:00:00Z`) - (CHART_DAYS - 1) * DAY)
    .toISOString()
    .slice(0, 10)
  const points = history
    .filter((point) => point.day >= firstDay)
    .map((point) => ({
      ...point,
      x: (dayIndex(point.day, firstDay) / (CHART_DAYS - 1)) * 100,
      y: 100 - point.score,
    }))

  // Trecho recalculado (I6) tracejado; ele encosta no primeiro dia apurado
  const firstMeasured = points.findIndex((point) => !point.reconstructed)
  const rebuilt = firstMeasured === -1 ? points : points.slice(0, firstMeasured + 1)
  const measured = firstMeasured === -1 ? [] : points.slice(firstMeasured)
  const current = active === null ? null : points[active]
  // O que o leitor de tela anuncia: o dia escolhido, ou o último
  const shown = current ?? points.at(-1)

  function pick(clientX, element) {
    const { left, width } = element.getBoundingClientRect()
    const x = ((clientX - left) / width) * 100
    const nearest = points.reduce(
      (best, point, index) => (Math.abs(point.x - x) < Math.abs(points[best].x - x) ? index : best),
      0,
    )
    setActive(nearest)
  }

  function handleKey(event) {
    if (event.key === 'ArrowLeft') setActive((index) => Math.max(0, (index ?? points.length) - 1))
    if (event.key === 'ArrowRight') {
      setActive((index) => Math.min(points.length - 1, (index ?? -1) + 1))
    }
  }

  return (
    <figure className={styles.chart}>
      {/* Slider: as setas percorrem os dias e o leitor de tela anuncia nota e dia */}
      <div
        className={styles.plot}
        role="slider"
        tabIndex={0}
        aria-label="Evolução do índice por dia"
        aria-valuemin={0}
        aria-valuemax={points.length - 1}
        aria-valuenow={active ?? points.length - 1}
        aria-valuetext={`${shown.score} em ${formatDay(shown.day)}`}
        onPointerMove={(event) => pick(event.clientX, event.currentTarget)}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive(points.length - 1)}
        onBlur={() => setActive(null)}
        onKeyDown={handleKey}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {[80, 60].map((limit) => (
            <line
              key={limit}
              className={styles.reference}
              x1="0"
              x2="100"
              y1={100 - limit}
              y2={100 - limit}
            />
          ))}
          {rebuilt.length > 1 && <path className={styles.rebuilt} d={linePath(rebuilt)} />}
          {measured.length > 0 && <path className={styles.line} d={linePath(measured)} />}
        </svg>

        <span className={styles.referenceLabel} style={{ '--y': '20%' }} aria-hidden="true">
          Bom (80)
        </span>
        <span className={styles.referenceLabel} style={{ '--y': '40%' }} aria-hidden="true">
          Regular (60)
        </span>

        {/* Ponto do último dia, e o cursor com o valor do dia escolhido */}
        <span
          className={styles.dot}
          style={{ '--x': `${points.at(-1).x}%`, '--y': `${points.at(-1).y}%` }}
          aria-hidden="true"
        />
        {current && (
          <>
            <span className={styles.crosshair} style={{ '--x': `${current.x}%` }} />
            <span
              className={styles.dot}
              style={{ '--x': `${current.x}%`, '--y': `${current.y}%` }}
            />
            <span
              className={`${styles.tooltip} ${current.x > 70 ? styles.tooltipLeft : ''}`}
              style={{ '--x': `${current.x}%` }}
              aria-hidden="true"
            >
              <strong>{current.score}</strong> em {formatDay(current.day)}
              {current.reconstructed && <small>recalculado</small>}
            </span>
          </>
        )}
      </div>

      <figcaption className={styles.axis}>
        <span>{formatDay(firstDay)}</span>
        {rebuilt.length > 1 && (
          <span className={styles.key}>
            <span className={styles.keySolid} aria-hidden="true" /> apurado
            <span className={styles.keyDashed} aria-hidden="true" /> recalculado
          </span>
        )}
        <span>{formatDay(lastDay)}</span>
      </figcaption>

      {/* Mesma informação do gráfico, para leitor de tela */}
      <table className={styles.visuallyHidden}>
        <caption>Índice de Governança por dia</caption>
        <thead>
          <tr>
            <th scope="col">Dia</th>
            <th scope="col">Nota</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.day}>
              <td>{formatDay(point.day)}</td>
              <td>
                {point.score}
                {point.reconstructed ? ' (recalculado)' : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

// scores: linhas de governance_scores da empresa (regras I1–I6)
export default function GovernanceIndex({ scores }) {
  const history = scoreHistory(scores)
  const last = history.at(-1)

  return (
    <section
      className={`panel elevation-1 ${styles.panel}`}
      aria-labelledby="governance-index-title"
    >
      <div className="panel-heading">
        <div>
          <span className="section-kicker">ÍNDICE DE GOVERNANÇA · 0 A 100</span>
          <h2 id="governance-index-title">Índice de Governança</h2>
        </div>
      </div>

      {!last ? (
        <p className={styles.muted}>
          O índice ainda não foi apurado. A apuração roda junto da sincronização com o GitHub, a
          cada hora.
        </p>
      ) : (
        <IndexContent history={history} last={last} />
      )}

      <div className={styles.ruleCard} role="note" aria-labelledby="index-rule-title">
        <Info size={16} aria-hidden="true" />

        <div>
          <strong id="index-rule-title">Como o índice é calculado</strong>
          <p>
            Cada projeto recebe uma nota dos últimos 30 dias: revisão de código (peso 30), fluxo de
            PRs (20), prazo (20), proteção da branch principal (15) e lead time (15). Critério sem
            dado fica de fora e os outros pesos são reescalados. A nota da empresa é a média dos
            projetos. Faixas: 80 ou mais é Bom, de 60 a 79 é Regular e abaixo de 60 é Crítico. O
            seletor de período não muda o índice.
          </p>
        </div>
      </div>
    </section>
  )
}

function IndexContent({ history, last }) {
  const band = scoreBand(last.score)
  const BandIcon = bandIcons[band]
  const change = scoreChange(history, CHANGE_DAYS)
  const lastRebuilt = history.filter((point) => point.reconstructed).at(-1)

  return (
    <div className={styles.layout}>
      <div className={styles.headline}>
        <p className={styles.score}>
          <strong>{last.score}</strong>
          <span>/100</span>
        </p>

        <StatusBadge status={band}>
          <BandIcon size={14} aria-hidden="true" /> {SCORE_BANDS[band]}
        </StatusBadge>

        <p className={styles.change}>{changeText(change)}</p>
        <p className={styles.muted}>
          Apurado às {formatTime(last.computedAt)} de {formatDay(last.day)}
        </p>
      </div>

      <ScoreChart history={history} />

      <div className={styles.breakdown}>
        <h3 className={styles.subtitle}>Critérios (média dos projetos)</h3>
        <ScoreBreakdown components={last.components} />
      </div>

      {lastRebuilt && (
        <p className={`${styles.muted} ${styles.notice}`}>
          Os dias até {formatDay(lastRebuilt.day)} foram recalculados pelas datas dos PRs, supondo a
          proteção da branch e o prazo iguais aos de hoje.
        </p>
      )}
    </div>
  )
}
