import Tooltip from '@/shared/ui/Tooltip'

// events: governanceMetrics().events. Contribuidores = logins distintos de commits
// e PRs no período (regra G7); commits só da branch principal
export default function RecentActivityPanel({ events, days }) {
  const items = [
    { label: 'Repositórios', value: events.repositories },
    { label: 'Commits', value: events.commits },
    { label: 'Branches', value: events.branches },
    { label: 'Contribuidores', value: events.contributors },
  ]

  return (
    <section className="panel repo-panel elevation-1">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">ATIVIDADE · {days} DIAS</span>
          <h2>Eventos de Desenvolvimento</h2>
        </div>

        <Tooltip label="O que é contado">
          <p>
            Commits da branch principal e contribuidores (quem fez commit ou abriu PR) nos últimos{' '}
            {days} dias. Repositórios e branches: total atual.
          </p>
        </Tooltip>
      </div>

      <div className="repo-stats">
        {items.map(({ label, value }) => (
          <div key={label}>
            <span>{value}</span>
            <small>{label}</small>
          </div>
        ))}
      </div>
    </section>
  )
}
