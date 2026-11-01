import { useState } from 'react'
import { LogOut, UserMinus, Users } from 'lucide-react'

import InviteModal from '@/features/rbac/components/InviteModal'
import RemoveMemberModal from '@/features/rbac/components/RemoveMemberModal'
import RoleDetailModal from '@/features/rbac/components/RoleDetailModal'
import {
  useMembers,
  useRegenerateJoinCode,
  useRemoveMember,
  useUpdateMemberRole,
} from '@/features/rbac/hooks/useMembers'
import styles from '@/features/rbac/RbacPage.module.css'
import { ROLES } from '@/features/rbac/utils/roles'
import { useToast } from '@/shared/hooks/useToast'
import StatusBadge from '@/shared/ui/StatusBadge'

function initialsOf(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}

// organization: a organização atual do usuário ({ id, name, role, joinCode })
export default function RbacPage({ organization, currentUserId }) {
  const { showToast } = useToast()
  const members = useMembers(organization.id)
  const updateRole = useUpdateMemberRole()
  const removeMember = useRemoveMember()
  const regenerateCode = useRegenerateJoinCode()

  const [selectedRole, setSelectedRole] = useState(null)
  const [memberToRemove, setMemberToRemove] = useState(null)
  const [inviteOpen, setInviteOpen] = useState(false)

  const isAdmin = organization.role === 'admin'

  async function run(action, successMessage) {
    try {
      await action()
      showToast(successMessage)
      return true
    } catch (error) {
      showToast(error.message, 'danger')
      return false
    }
  }

  function changeRole(member, role) {
    run(
      () =>
        updateRole.mutateAsync({ organizationId: organization.id, userId: member.userId, role }),
      `${member.name} agora é ${ROLES[role].label}.`,
    )
  }

  async function confirmRemove() {
    const member = memberToRemove
    const isSelf = member.userId === currentUserId

    setMemberToRemove(null)
    await run(
      () => removeMember.mutateAsync({ organizationId: organization.id, userId: member.userId }),
      isSelf ? 'Você saiu da organização.' : `${member.name} foi removido da organização.`,
    )
  }

  function regenerate() {
    run(() => regenerateCode.mutateAsync(organization.id), 'Novo código gerado.')
  }

  return (
    <main className="dashboard-content">
      <div className="dashboard-intro">
        <div>
          <span className="eyebrow">CONTROLE DE ACESSO</span>

          <p>Membros de {organization.name} e o que cada papel pode fazer.</p>
        </div>

        {isAdmin && (
          <div className="intro-actions">
            <button type="button" className="primary-button" onClick={() => setInviteOpen(true)}>
              <Users size={16} />
              Convidar
            </button>
          </div>
        )}
      </div>

      <section className={`panel elevation-1 ${styles.rolesPanel}`}>
        <div className="panel-heading">
          <h2>Papéis e permissões</h2>
        </div>

        <div className={styles.roles}>
          {Object.entries(ROLES).map(([key, role]) => {
            const RoleIcon = role.icon

            return (
              <button
                key={key}
                type="button"
                className={`metric-card elevation-1 ${styles.roleCard}`}
                onClick={() => setSelectedRole(role)}
              >
                <div className="metric-icon">
                  <RoleIcon size={20} />
                </div>

                <span className={styles.roleText}>
                  <strong>{role.label}</strong>
                  <small>{role.description}</small>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="panel elevation-1">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">EQUIPE</span>
            <h2>Membros</h2>
          </div>
        </div>

        {members.isPending && (
          <p role="status" className={styles.state}>
            Carregando membros…
          </p>
        )}

        {members.isError && (
          <p role="alert" className={styles.state}>
            {members.error.message}
          </p>
        )}

        {members.isSuccess && (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>MEMBRO</th>
                  <th>E-MAIL</th>
                  <th>PAPEL</th>
                  <th>
                    <span className={styles.srOnly}>Ações</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {members.data.map((member) => {
                  const isSelf = member.userId === currentUserId

                  return (
                    <tr key={member.userId}>
                      <td>
                        <div className="service-name">
                          <span className="avatar">{initialsOf(member.name)}</span>

                          <b>
                            {member.name}
                            {isSelf && <span className={styles.you}> (você)</span>}
                          </b>
                        </div>
                      </td>

                      <td className="mono">{member.email}</td>

                      <td>
                        {isAdmin ? (
                          <select
                            className={styles.roleSelect}
                            aria-label={`Papel de ${member.name}`}
                            value={member.role}
                            onChange={(event) => changeRole(member, event.target.value)}
                          >
                            {Object.entries(ROLES).map(([key, role]) => (
                              <option key={key} value={key}>
                                {role.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <StatusBadge status="success">{ROLES[member.role].label}</StatusBadge>
                        )}
                      </td>

                      <td className={styles.actionsCell}>
                        {(isAdmin || isSelf) && (
                          <button
                            type="button"
                            className="secondary-button small"
                            onClick={() => setMemberToRemove(member)}
                            aria-label={isSelf ? 'Sair da organização' : `Remover ${member.name}`}
                          >
                            {isSelf ? <LogOut size={14} /> : <UserMinus size={14} />}
                            {isSelf ? 'Sair' : 'Remover'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedRole && (
        <RoleDetailModal role={selectedRole} onClose={() => setSelectedRole(null)} />
      )}

      {memberToRemove && (
        <RemoveMemberModal
          member={memberToRemove}
          isSelf={memberToRemove.userId === currentUserId}
          organizationName={organization.name}
          onClose={() => setMemberToRemove(null)}
          onConfirm={confirmRemove}
        />
      )}

      {inviteOpen && (
        <InviteModal
          joinCode={organization.joinCode}
          regenerating={regenerateCode.isPending}
          onRegenerate={regenerate}
          onClose={() => setInviteOpen(false)}
        />
      )}
    </main>
  )
}
