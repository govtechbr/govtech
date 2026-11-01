import { Check } from 'lucide-react'

import styles from '@/features/rbac/RbacPage.module.css'
import Modal from '@/shared/ui/Modal'

export default function RoleDetailModal({ role, onClose }) {
  const RoleIcon = role.icon

  return (
    <Modal title={role.label} kicker="DETALHES DO PAPEL" onClose={onClose}>
      <div className={styles.roleSummary}>
        <div className="metric-icon">
          <RoleIcon size={20} />
        </div>

        <p>{role.description}</p>
      </div>

      <div className={styles.permissions}>
        <strong>O que este papel pode fazer</strong>

        <ul>
          {role.permissions.map((permission) => (
            <li key={permission}>
              <Check size={16} aria-hidden="true" />
              {permission}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.modalActions}>
        <button type="button" className="secondary-button small" onClick={onClose}>
          Fechar
        </button>
      </div>
    </Modal>
  )
}
