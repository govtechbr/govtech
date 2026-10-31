import { useState } from 'react'
import { Check, X } from 'lucide-react'

import { services } from '../../data/mockData'

export default function ProjectFormModal({ project, onClose, onSave }) {
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    deadline: project?.deadline || '',
    owner: project?.owner || '',
    priority: project?.priority || 'medium',
    progress: project?.progress ?? 0,
    repositories: Array.isArray(project?.repositories)
      ? project.repositories
      : [],
  })

  const toggleRepository = (repositoryName) => {
    setForm((current) => ({
      ...current,
      repositories: current.repositories.includes(repositoryName)
        ? current.repositories.filter((item) => item !== repositoryName)
        : [...current.repositories, repositoryName],
    }))
  }

  const submit = (event) => {
    event.preventDefault()
    onSave(form)
  }

  return (
    <div className="detail-popover" style={{ maxWidth: '580px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div>
          <span className="section-kicker">
            {project ? 'EDIÇÃO DE PROJETO' : 'CADASTRO DE PROJETO'}
          </span>

          <h3>{project ? 'Editar Projeto' : 'Novo Projeto'}</h3>
        </div>

        <button className="icon-button" onClick={onClose}>
          <X size={17} />
        </button>
      </div>

      <form
        onSubmit={submit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <label>
          <strong style={{ display: 'block', marginBottom: '6px' }}>
            Nome do Projeto
          </strong>

          <input
            required
            value={form.name}
            onChange={(event) =>
              setForm({
                ...form,
                name: event.target.value,
              })
            }
            style={inputStyle}
          />
        </label>

        <label>
          <strong style={{ display: 'block', marginBottom: '6px' }}>
            Objetivo do Projeto
          </strong>

          <textarea
            required
            rows={3}
            value={form.description}
            onChange={(event) =>
              setForm({
                ...form,
                description: event.target.value,
              })
            }
            style={{
              ...inputStyle,
              resize: 'vertical',
            }}
          />
        </label>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}
        >
          <label>
            <strong style={{ display: 'block', marginBottom: '6px' }}>
              Deadline
            </strong>

            <input
              required
              type="date"
              value={form.deadline}
              onChange={(event) =>
                setForm({
                  ...form,
                  deadline: event.target.value,
                })
              }
              style={inputStyle}
            />
          </label>

          <label>
            <strong style={{ display: 'block', marginBottom: '6px' }}>
              Prioridade
            </strong>

            <select
              value={form.priority}
              onChange={(event) =>
                setForm({
                  ...form,
                  priority: event.target.value,
                })
              }
              style={inputStyle}
            >
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
            </select>
          </label>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}
        >
          <label>
            <strong style={{ display: 'block', marginBottom: '6px' }}>
              Responsável
            </strong>

            <input
              required
              value={form.owner}
              onChange={(event) =>
                setForm({
                  ...form,
                  owner: event.target.value,
                })
              }
              style={inputStyle}
            />
          </label>

          <label>
            <strong style={{ display: 'block', marginBottom: '6px' }}>
              Progresso (%)
            </strong>

            <input
              required
              type="number"
              min="0"
              max="100"
              value={form.progress}
              onChange={(event) =>
                setForm({
                  ...form,
                  progress: event.target.value,
                })
              }
              style={inputStyle}
            />
          </label>
        </div>

        <div>
          <strong
            style={{
              display: 'block',
              marginBottom: '8px',
            }}
          >
            Repositórios Vinculados
          </strong>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            }}
          >
            {services.map((service) => (
              <label
                key={service.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  fontSize: '12px',
                }}
              >
                <input
                  type="checkbox"
                  checked={form.repositories.includes(service.name)}
                  onChange={() => toggleRepository(service.name)}
                />

                {service.name}
              </label>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginTop: '6px',
          }}
        >
          <button className="primary-button" type="submit">
            <Check size={16} />
            {project ? 'Salvar Projeto' : 'Criar Projeto'}
          </button>

          <button
            className="secondary-button"
            type="button"
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '10px',
  border: '1px solid var(--border)',
  borderRadius: '7px',
  background: 'var(--surface)',
  color: 'var(--text)',
}