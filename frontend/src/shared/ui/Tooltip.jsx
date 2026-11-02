import { useEffect, useId, useRef, useState } from 'react'
import { Info } from 'lucide-react'

import styles from '@/shared/ui/Tooltip.module.css'

// Botão-ícone que mostra um texto explicativo: abre com o mouse, o foco do
// teclado ou um toque; fecha com Esc, ao sair, ao perder o foco ou com um toque fora.
// O texto fica sempre ligado ao botão por aria-describedby, mesmo fechado.
export default function Tooltip({ label = 'Como é calculado', children }) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)
  const id = useId()

  // Assina eventos do documento só enquanto aberto (Esc e toque fora)
  useEffect(() => {
    if (!open) return undefined

    function handleKey(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    function handlePointer(event) {
      if (!wrapperRef.current.contains(event.target)) setOpen(false)
    }

    document.addEventListener('keydown', handleKey)
    document.addEventListener('pointerdown', handlePointer)

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('pointerdown', handlePointer)
    }
  }, [open])

  // No toque, pointerenter/leave disparam junto do toque: só o mouse abre e fecha por hover
  function handleHover(event, value) {
    if (event.pointerType === 'mouse') setOpen(value)
  }

  return (
    <div
      ref={wrapperRef}
      className={styles.wrapper}
      onPointerEnter={(event) => handleHover(event, true)}
      onPointerLeave={(event) => handleHover(event, false)}
    >
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.active : ''}`}
        aria-label={label}
        aria-describedby={id}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen(true)}
      >
        <Info size={16} aria-hidden="true" />
      </button>

      <div id={id} role="tooltip" className={styles.tooltip} hidden={!open}>
        {children}
      </div>
    </div>
  )
}
