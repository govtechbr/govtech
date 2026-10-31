import { AlertTriangle, Check, X } from 'lucide-react'
import { useEffect } from 'react'

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timeout = window.setTimeout(onClose, 3500)

    return () => window.clearTimeout(timeout)
  }, [onClose])

  return (
    <div className={`toast toast-${type}`}>
      {type === 'success' && <Check size={17} />}
      {type === 'warning' && <AlertTriangle size={17} />}
      {type === 'danger' && <AlertTriangle size={17} />}

      <span>{message}</span>

      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar aviso"
        style={{
          display: 'inline-flex',
          marginLeft: '8px',
          padding: 0,
          border: 0,
          background: 'transparent',
          color: 'inherit',
        }}
      >
        <X size={15} />
      </button>
    </div>
  )
}