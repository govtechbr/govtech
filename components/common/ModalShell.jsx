import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function ModalShell({
  children,
  onClose,
  title,
  subtitle,
  maxWidth = '620px',
  closeLabel = 'Fechar modal',
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      role="presentation"
      onMouseDown={onClose}
      style={{
        position: 'fixed',
        zIndex: 200,
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'var(--color-overlay)',
      }}
    >
      <section
        className="elevation-4"
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Modal'}
        onMouseDown={(event) => event.stopPropagation()}
        style={{
          width: '100%',
          maxWidth,
          maxHeight: 'calc(100vh - 40px)',
          overflowY: 'auto',
          padding: '22px',
          border: '1px solid var(--color-border)',
          borderRadius: '14px',
          background: 'var(--color-surface-elevated)',
          color: 'var(--color-text-primary)',
        }}
      >
        {(title || subtitle) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '16px',
              marginBottom: '18px',
            }}
          >
            <div>
              {subtitle && (
                <span className="section-kicker">{subtitle}</span>
              )}

              {title && (
                <h3
                  style={{
                    marginTop: subtitle ? '6px' : 0,
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-display)',
                    fontSize: '20px',
                    letterSpacing: '-0.04em',
                  }}
                >
                  {title}
                </h3>
              )}
            </div>

            <button
              type="button"
              className="icon-button"
              onClick={onClose}
              aria-label={closeLabel}
              style={{
                flexShrink: 0,
              }}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {!title && !subtitle && (
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label={closeLabel}
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
            }}
          >
            <X size={18} />
          </button>
        )}

        {children}
      </section>
    </div>
  )
}