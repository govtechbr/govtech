import { Check } from 'lucide-react'
import { useState } from 'react'

import Modal from '@/shared/ui/Modal'
import styles from './ProjectModals.module.css'

export default function ProjectFormModal({ project, onClose, onSave }) {
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    deadline: project?.deadline || '',
    owner: project?.owner || '',
    priority: project?.priority || 'medium',
    progress: project?.progress ?? 0,
  })

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const submit = (event) => {
    event.preventDefault()
    onSave(form)
  }

  return (
    <Modal
      title={project ? 'Editar Projeto' : 'Novo Projeto'}
      kicker={project ? 'EDIÇÃO DE PROJETO' : 'CADASTRO DE PROJETO'}
      onClose={onClose}
    >
      <form className={styles.form} onSubmit={submit}>
        <label className={styles.field}>
          Nome do Projeto
          <input
            className={styles.input}
            required
            value={form.name}
            onChange={updateField('name')}
          />
        </label>

        <label className={styles.field}>
          Objetivo do Projeto
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            required
            rows={3}
            value={form.description}
            onChange={updateField('description')}
          />
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            Deadline
            <input
              className={styles.input}
              required
              type="date"
              value={form.deadline}
              onChange={updateField('deadline')}
            />
          </label>

          <label className={styles.field}>
            Prioridade
            <select
              className={styles.input}
              value={form.priority}
              onChange={updateField('priority')}
            >
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
            </select>
          </label>
        </div>

        <div className={styles.row}>
          <label className={styles.field}>
            Responsável
            <input
              className={styles.input}
              required
              value={form.owner}
              onChange={updateField('owner')}
            />
          </label>

          <label className={styles.field}>
            Progresso (%)
            <input
              className={styles.input}
              required
              type="number"
              min="0"
              max="100"
              value={form.progress}
              onChange={updateField('progress')}
            />
          </label>
        </div>

        <div className={styles.actions}>
          <button className="primary-button" type="submit">
            <Check size={16} />
            {project ? 'Salvar Projeto' : 'Criar Projeto'}
          </button>

          <button className="secondary-button" type="button" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  )
}
