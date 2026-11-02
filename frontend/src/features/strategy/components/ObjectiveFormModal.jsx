import { Check } from 'lucide-react'
import { useState } from 'react'

import Modal from '@/shared/ui/Modal'
import styles from '../StrategyPage.module.css'

export default function ObjectiveFormModal({ objective, onClose, onSave }) {
  const [form, setForm] = useState({
    title: objective?.title || '',
    description: objective?.description || '',
  })

  const updateField = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }))

  const submit = (event) => {
    event.preventDefault()
    onSave(form)
  }

  return (
    <Modal
      title={objective ? 'Editar objetivo' : 'Novo objetivo'}
      kicker="OBJETIVO ESTRATÉGICO"
      onClose={onClose}
    >
      <form className={styles.form} onSubmit={submit}>
        <label className={styles.field}>
          Título
          <input
            className={styles.input}
            required
            maxLength={120}
            value={form.title}
            onChange={updateField('title')}
          />
        </label>

        <label className={styles.field}>
          Descrição
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            rows={3}
            maxLength={500}
            value={form.description}
            onChange={updateField('description')}
          />
        </label>

        <div className={styles.formActions}>
          <button className="primary-button" type="submit">
            <Check size={16} />
            {objective ? 'Salvar objetivo' : 'Criar objetivo'}
          </button>

          <button className="secondary-button" type="button" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  )
}
