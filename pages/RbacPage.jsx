import { useState } from 'react'
import {
  Search,
  Shield,
  UserRound,
  Users,
} from 'lucide-react'

import RoleDetailModal from '../components/rbac/RoleDetailModal'
import { accessRoles } from '../data/mockData'
import Icon from '../components/common/Icon'
import StatusBadge from '../components/common/StatusBadge'

export default function RbacPage() {
  const [selectedRole, setSelectedRole] = useState(null)

  const users = [
    {
      initials: 'MC',
      name: 'Marina Costa',
      email: 'marina.costa@govtech.ms',
      role: 'Admin',
      team: 'Plataforma',
      status: 'Ativo',
      lastAccess: 'Agora',
    },
    {
      initials: 'AS',
      name: 'Ana Silva',
      email: 'ana.silva@govtech.ms',
      role: 'Dev Lead',
      team: 'Backend',
      status: 'Ativo',
      lastAccess: '8 min atrás',
    },
    {
      initials: 'CM',
      name: 'Carlos Melo',
      email: 'carlos.melo@govtech.ms',
      role: 'Dev',
      team: 'Frontend',
      status: 'Ativo',
      lastAccess: '21 min atrás',
    },
    {
      initials: 'JS',
      name: 'João Santos',
      email: 'joao.santos@govtech.ms',
      role: 'Auditor',
      team: 'Compliance',
      status: 'Ausente',
      lastAccess: '2h atrás',
    },
  ]

  return (
    <main className="dashboard-content">
      <div className="dashboard-intro">
        <div>
          <span className="eyebrow">CONTROLE DE ACESSO</span>

          <p>Gerencie papéis, permissões e acesso baseado em funções.</p>
        </div>

        <div className="intro-actions">
          <button type="button" className="secondary-button">
            <Users size={16} />
            Convidar usuário
          </button>

          <button type="button" className="primary-button">
            <Shield size={16} />
            Nova função
          </button>
        </div>
      </div>

      <section className="panel elevation-1" style={{ marginBottom: '24px' }}>
        <div className="panel-heading">
          <h2>Papéis e permissões</h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
          }}
        >
          {accessRoles.map((role) => (
            <button
              key={role.label}
              type="button"
              className="metric-card elevation-1"
              onClick={() => setSelectedRole(role)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                minHeight: '80px',
                padding: '16px',
                background: 'var(--surface)',
                border:
                  selectedRole?.label === role.label
                    ? '2px solid var(--color-primary-500)'
                    : '1px solid transparent',
                textAlign: 'left',
              }}
            >
              <div className="metric-icon" style={{ flexShrink: 0 }}>
                <Icon name={role.icon} size={20} />
              </div>

              <div className="metric-content">
                <strong
                  style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    lineHeight: '1.3',
                  }}
                >
                  {role.label}
                </strong>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="panel elevation-1">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">USUÁRIOS ATIVOS</span>
            <h2>Lista de Usuários</h2>
          </div>

          <div className="panel-actions">
            <button type="button" className="secondary-button">
              <Search size={15} />
              Filtrar
            </button>

            <button type="button" className="primary-button small">
              <UserRound size={14} />
              Adicionar
            </button>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>USUÁRIO</th>
                <th>EMAIL</th>
                <th>PAPEL</th>
                <th>TIME</th>
                <th>STATUS</th>
                <th>ÚLTIMO ACESSO</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.email}>
                  <td>
                    <div className="service-name">
                      <span className="avatar">{user.initials}</span>

                      <div>
                        <b>{user.name}</b>
                      </div>
                    </div>
                  </td>

                  <td className="mono">{user.email}</td>

                  <td>
                    <StatusBadge status="success">
                      {user.role}
                    </StatusBadge>
                  </td>

                  <td>{user.team}</td>

                  <td>
                    <StatusBadge
                      status={
                        user.status === 'Ativo'
                          ? 'success'
                          : 'warning'
                      }
                    >
                      {user.status}
                    </StatusBadge>
                  </td>

                  <td className="muted-cell">{user.lastAccess}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedRole && (
        <RoleDetailModal
          role={selectedRole}
          onClose={() => setSelectedRole(null)}
        />
      )}
    </main>
  )
}