import { useEffect, useLayoutEffect, useRef } from 'react'

const GAP = 4
const GUTTER = 8

// Posiciona um popover (renderizado em portal, position: fixed) junto do campo que o abriu,
// sem sair da tela: abre para cima quando falta espaço embaixo e encosta nas bordas laterais.
// Também fecha ao clicar fora e com Esc. A posição vai em variáveis CSS (--popover-*).
export function usePopover({ open, onClose }) {
  const anchorRef = useRef(null)
  const popoverRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useLayoutEffect(() => {
    if (!open) return undefined

    function place() {
      const anchor = anchorRef.current
      const popover = popoverRef.current
      if (!anchor || !popover) return

      const rect = anchor.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const spaceBelow = viewportHeight - rect.bottom - GAP - GUTTER
      const spaceAbove = rect.top - GAP - GUTTER

      popover.style.setProperty('--popover-min-width', `${rect.width}px`)

      const height = popover.scrollHeight
      const openUp = height > spaceBelow && spaceAbove > spaceBelow
      const maxHeight = Math.max(openUp ? spaceAbove : spaceBelow, 0)
      const top = openUp ? rect.top - GAP - Math.min(height, maxHeight) : rect.bottom + GAP
      const maxLeft = viewportWidth - popover.offsetWidth - GUTTER
      const left = Math.max(GUTTER, Math.min(rect.left, maxLeft))

      popover.style.setProperty('--popover-top', `${top}px`)
      popover.style.setProperty('--popover-left', `${left}px`)
      popover.style.setProperty('--popover-max-height', `${maxHeight}px`)
    }

    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)

    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined

    function handlePointerDown(event) {
      if (anchorRef.current?.contains(event.target)) return
      if (popoverRef.current?.contains(event.target)) return
      onCloseRef.current({ restoreFocus: false })
    }

    // Esc é tratado aqui (e não no onKeyDown do React) para não chegar ao Modal que
    // envolve o campo: o listener nativo do diálogo dispararia antes e fecharia o modal.
    function handleKeyDown(event) {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      event.preventDefault()
      onCloseRef.current({ restoreFocus: true })
    }

    const anchor = anchorRef.current
    const popover = popoverRef.current

    document.addEventListener('pointerdown', handlePointerDown)
    anchor?.addEventListener('keydown', handleKeyDown)
    popover?.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      anchor?.removeEventListener('keydown', handleKeyDown)
      popover?.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return { anchorRef, popoverRef }
}
