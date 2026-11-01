import { GitBranch, ShieldCheck } from 'lucide-react'

import MetricCard from '@/features/repositories/components/MetricCard'
import StatusBadge from '@/shared/ui/StatusBadge'

export default function BranchesList({ branches }) {
  const protectedCount = branches.filter((branch) => branch.protected).length

  return (
    <>
      <section className="metrics-grid">
        <MetricCard
          icon={GitBranch}
          label="Branches"
          value={branches.length}
          hint="Ativas no GitHub"
        />
        <MetricCard
          icon={ShieldCheck}
          label="Protegidas"
          value={protectedCount}
          hint="Exigem revisão para mudar"
        />
      </section>

      <section className="panel elevation-1">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">FLUXO DE DESENVOLVIMENTO</span>
            <h2>Branches</h2>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>BRANCH</th>
                <th>REPOSITÓRIO</th>
                <th>ÚLTIMO COMMIT</th>
                <th>PROTEÇÃO</th>
              </tr>
            </thead>

            <tbody>
              {branches.map((branch) => (
                <tr key={branch.id}>
                  <td>
                    <div className="service-name">
                      <span className="avatar">
                        <GitBranch size={15} />
                      </span>

                      <b>
                        {branch.name}
                        {branch.name === branch.repository.default_branch && ' (padrão)'}
                      </b>
                    </div>
                  </td>

                  <td className="mono">{branch.repository.name}</td>
                  <td className="mono">{branch.last_commit_sha.slice(0, 7)}</td>
                  <td>
                    <StatusBadge status={branch.protected ? 'success' : 'default'}>
                      {branch.protected ? 'Protegida' : 'Livre'}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
