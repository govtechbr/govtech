import { Trash2 } from 'lucide-react'

import Modal from '@/shared/ui/Modal'
import styles from './ProjectModals.module.css'

export default function DeleteProjectModal({ project, onClose, onConfirm }) {
  return (
    <Modal title="Confirmar exclusão" kicker="EXCLUIR PROJETO" size="sm" onClose={onClose}>
      <p className={styles.description}>
        Deseja excluir o projeto <strong>{project.name}</strong>? Esta ação remove o item do
        dashboard e do armazenamento local.
      </p>

      <div className={styles.actions}>
        <button type="button" className="secondary-button" onClick={onClose}>
          Cancelar
        </button>

        <button
          type="button"
          className={`primary-button ${styles.dangerButton}`}
          onClick={onConfirm}
        >
          <Trash2 size={16} />
          Excluir Projeto
        </button>
      </div>
    </Modal>
  )
}
