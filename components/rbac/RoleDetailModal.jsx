import { Check } from 'lucide-react'

import ModalShell from '../common/ModalShell'
import Icon from '../common/Icon'
import { COLORS } from '../../constants/colors'

const rolePermissions = {
  Admin: [
    'Acesso completo ao dashboard',
    'Gerenciamento de usuários e funções',
    'Configuração de integrações',
    'Criação e alteração de políticas',
    'Exportação de relatórios e auditorias',
  ],
  Developer: [
    'Consulta de repositórios e branches',
    'Acompanhamento de Pull Requests',
    'Visualização de pipelines',
    'Acesso aos alertas técnicos',
  ],
  Stakeholder: [
    'Acesso à visão executiva',
    'Consulta de status de projetos',
    'Acompanhamento de deadlines',
    'Visualização de KPIs e relatórios',
  ],
  Viewer: [
    'Consulta de dashboards',
    'Visualização de auditorias',
    'Acesso somente leitura aos projetos',
    'Sem permissões de alteração',
  ],
}

export default function RoleDetailModal({ role, onClose }) {
  const permissions = rolePermissions[role.label] || [
    'Permissões configuráveis para esta função.',
  ]

  return (
    <ModalShell
      onClose={onClose}
      title={role.label}
      subtitle="DETALHES DA FUNÇÃO"
      maxWidth="520px"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '18px',
        }}
      >
        <div className="metric-icon">
          <Icon name={role.icon} size={20} />
        </div>

        <p
          style={{
            margin: 0,
            color: 'var(--muted)',
            fontSize: '14px',
          }}
        >
          {role.description}
        </p>
      </div>

      <div
        style={{
          paddingTop: '16px',
          borderTop: '1px solid var(--border)',
        }}
      >
        <strong
          style={{
            display: 'block',
            marginBottom: '12px',
            fontSize: '13px',
          }}
        >
          Permissões associadas
        </strong>

        <div
          style={{
            display: 'grid',
            gap: '10px',
          }}
        >
          {permissions.map((permission) => (
            <div
              key={permission}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                fontSize: '13px',
              }}
            >
              <Check size={16} style={{ color: COLORS.success }} />
              <span>{permission}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginTop: '24px',
        }}
      >
        <button className="primary-button small">
          Editar permissões
        </button>

        <button className="secondary-button small" onClick={onClose}>
          Fechar
        </button>
      </div>
    </ModalShell>
  )
}