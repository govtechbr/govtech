import { RefreshCw } from 'lucide-react'

import styles from '@/features/rbac/RbacPage.module.css'
import InviteCode from '@/shared/layout/InviteCode'
import Modal from '@/shared/ui/Modal'

export default function InviteModal({ joinCode, regenerating, onRegenerate, onClose }) {
  return (
    <Modal title="Convidar para a organização" kicker="CONVITE" size="sm" onClose={onClose}>
      <p className={styles.description}>
        Quem recebe o código cria a conta e escolhe <strong>Entrar com código</strong>. Entra como
        Viewer; depois você muda o papel aqui.
      </p>

      <InviteCode code={joinCode} />

      <div className={styles.modalActions}>
        <button
          type="button"
          className="secondary-button"
          onClick={onRegenerate}
          disabled={regenerating}
        >
          <RefreshCw size={16} />
          {regenerating ? 'Gerando…' : 'Gerar novo código'}
        </button>

        <button type="button" className="primary-button" onClick={onClose}>
          Pronto
        </button>
      </div>

      <p className={styles.hint}>Gerar um novo código invalida o anterior.</p>
    </Modal>
  )
}
