import { Trash2 } from 'lucide-react'

import Modal from '@/shared/ui/Modal'
import styles from '../StrategyPage.module.css'

export default function DeleteObjectiveModal({ objective, onClose, onConfirm }) {
  return (
    <Modal title="Confirmar exclusão" kicker="EXCLUIR OBJETIVO" size="sm" onClose={onClose}>
      <p className={styles.description}>
        Deseja excluir o objetivo <strong>{objective.title}</strong>? Os projetos vinculados
        continuam, mas deixam de apontar para ele. A ação não pode ser desfeita.
      </p>

      <div className={styles.formActions}>
        <button type="button" className="secondary-button" onClick={onClose}>
          Cancelar
        </button>

        <button
          type="button"
          className={`primary-button ${styles.dangerButton}`}
          onClick={onConfirm}
        >
          <Trash2 size={16} />
          Excluir objetivo
        </button>
      </div>
    </Modal>
  )
}
