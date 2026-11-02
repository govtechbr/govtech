import { Check } from 'lucide-react'
import { useState } from 'react'

import DatePicker from '@/shared/ui/DatePicker'
import Modal from '@/shared/ui/Modal'
import Select from '@/shared/ui/Select'
import styles from './ProjectModals.module.css'

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Média' },
  { value: 'low', label: 'Baixa' },
]

export default function ProjectFormModal({ project, onClose, onSave }) {
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    deadline: project?.deadline || '',
    owner: project?.owner || '',
    priority: project?.priority || 'medium',
  })

  const [deadlineError, setDeadlineError] = useState('')

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const updateField = (field) => (event) => setField(field, event.target.value)

  const submit = (event) => {
    event.preventDefault()

    // O DatePicker não é um input nativo: o "required" do deadline é conferido aqui
    if (!form.deadline) {
      setDeadlineError('Informe o deadline.')
      return
    }

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
          <DatePicker
            label="Deadline"
            value={form.deadline}
            error={deadlineError}
            onChange={(value) => {
              setField('deadline', value)
              setDeadlineError('')
            }}
          />

          <Select
            label="Prioridade"
            options={PRIORITY_OPTIONS}
            value={form.priority}
            onChange={(value) => setField('priority', value)}
          />
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
