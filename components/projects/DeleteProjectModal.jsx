import { Trash2 } from 'lucide-react'

export default function DeleteProjectModal({
  project,
  onClose,
  onConfirm,
}) {
  return (
    <div className="detail-popover" style={{ maxWidth: '440px' }}>
      <span className="section-kicker">EXCLUIR PROJETO</span>

      <h3>Confirmar exclusão</h3>

      <p
        style={{
          color: 'var(--muted)',
          fontSize: '14px',
          lineHeight: 1.6,
        }}
      >
        Deseja excluir o projeto <strong>{project.name}</strong>? Esta ação
        remove o item do dashboard e do armazenamento local.
      </p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          marginTop: '22px',
        }}
      >
        <button className="secondary-button" onClick={onClose}>
          Cancelar
        </button>

        <button
          className="primary-button"
          onClick={onConfirm}
          style={{ background: 'var(--color-danger)' }}
        >
          <Trash2 size={16} />
          Excluir Projeto
        </button>
      </div>
    </div>
  )
}