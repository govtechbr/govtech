import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'

import styles from './Modal.module.css'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Diálogo acessível: foco preso, Esc fecha, foco volta para quem abriu.
// No celular (< 640 px) vira uma folha que sobe da parte de baixo da tela.
export default function Modal({ title, kicker, onClose, size = 'md', children }) {
  const titleId = useId()
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const dialog = dialogRef.current
    const previouslyFocused = document.activeElement

    dialog.querySelector(FOCUSABLE)?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab') return

      const focusable = [...dialog.querySelectorAll(FOCUSABLE)]
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    dialog.addEventListener('keydown', handleKeyDown)

    return () => {
      dialog.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [])

  return (
    <div className={styles.overlay}>
      <button
        type="button"
        className={styles.backdrop}
        onClick={onClose}
        aria-hidden="true"
        tabIndex={-1}
      />

      <section
        ref={dialogRef}
        className={`${styles.dialog} ${styles[size]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className={styles.header}>
          <div>
            {kicker && <span className="section-kicker">{kicker}</span>}
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
          </div>

          <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </header>

        {children}
      </section>
    </div>
  )
}
