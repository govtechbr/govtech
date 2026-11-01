import { LogOut, UserMinus } from 'lucide-react'

import styles from '@/features/rbac/RbacPage.module.css'
import Modal from '@/shared/ui/Modal'

// Serve para remover alguém (admin) e para o próprio usuário sair
export default function RemoveMemberModal({
  member,
  isSelf,
  organizationName,
  onClose,
  onConfirm,
}) {
  const ActionIcon = isSelf ? LogOut : UserMinus

  return (
    <Modal
      title={isSelf ? 'Sair da organização' : 'Remover membro'}
      kicker="ACESSO"
      size="sm"
      onClose={onClose}
    >
      <p className={styles.description}>
        {isSelf ? (
          <>
            Você perde o acesso a <strong>{organizationName}</strong>. Para voltar, vai precisar de
            um novo código de convite.
          </>
        ) : (
          <>
            <strong>{member.name}</strong> perde o acesso a <strong>{organizationName}</strong>.
            Para voltar, vai precisar do código de convite.
          </>
        )}
      </p>

      <div className={styles.modalActions}>
        <button type="button" className="secondary-button" onClick={onClose}>
          Cancelar
        </button>

        <button
          type="button"
          className={`primary-button ${styles.dangerButton}`}
          onClick={onConfirm}
        >
          <ActionIcon size={16} />
          {isSelf ? 'Sair' : 'Remover'}
        </button>
      </div>
    </Modal>
  )
}
