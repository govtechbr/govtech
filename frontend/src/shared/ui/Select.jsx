import { Check, ChevronDown } from 'lucide-react'
import { forwardRef, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { usePopover } from '@/shared/hooks/usePopover'
import styles from './Select.module.css'

const TYPEAHEAD_RESET_MS = 500

function assignRef(ref, node) {
  if (typeof ref === 'function') ref(node)
  else if (ref) ref.current = node
}

// Lista suspensa no estilo do sistema (padrão ARIA "listbox" aberto por botão).
// onChange recebe o valor (não o evento): com react-hook-form, use via <Controller>.
const Select = forwardRef(function Select(
  {
    label,
    options,
    value,
    onChange,
    onBlur,
    disabled = false,
    placeholder = 'Selecione…',
    name,
    id,
    error,
    size = 'md',
    icon: Icon,
    className,
    'aria-label': ariaLabel,
  },
  ref,
) {
  const generatedId = useId()
  const triggerId = id || `${generatedId}-trigger`
  const labelId = `${generatedId}-label`
  const valueId = `${generatedId}-value`
  const listboxId = `${generatedId}-listbox`
  const errorId = `${generatedId}-error`

  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const typeahead = useRef({ text: '', timer: null })

  const selectedIndex = options.findIndex((option) => option.value === value)
  const selected = options[selectedIndex]

  const close = ({ restoreFocus = true } = {}) => {
    setOpen(false)
    if (restoreFocus) anchorRef.current?.focus()
  }

  const { anchorRef, popoverRef } = usePopover({ open, onClose: close })

  useEffect(() => {
    if (open) popoverRef.current?.focus()
  }, [open, popoverRef])

  useEffect(() => {
    if (!open || activeIndex < 0) return
    document.getElementById(`${listboxId}-${activeIndex}`)?.scrollIntoView?.({ block: 'nearest' })
  }, [open, activeIndex, listboxId])

  useEffect(() => () => clearTimeout(typeahead.current.timer), [])

  const openAt = (index) => {
    if (disabled || options.length === 0) return
    setActiveIndex(index)
    setOpen(true)
  }

  const choose = (index) => {
    const option = options[index]
    if (option && option.value !== value) onChange?.(option.value)
    close()
  }

  // Digitar letras leva à primeira opção que começa com o texto digitado
  const findByTypeahead = (key) => {
    const state = typeahead.current
    clearTimeout(state.timer)
    state.text += key.toLowerCase()
    state.timer = setTimeout(() => {
      state.text = ''
    }, TYPEAHEAD_RESET_MS)

    const start = Math.max(activeIndex, selectedIndex, 0)
    const ordered = [...options.slice(start), ...options.slice(0, start)]
    const match = ordered.find((option) => option.label.toLowerCase().startsWith(state.text))
    return match ? options.indexOf(match) : -1
  }

  const isPrintable = (event) =>
    event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey

  const handleTriggerKeyDown = (event) => {
    const fallback = selectedIndex >= 0 ? selectedIndex : 0

    if (['ArrowDown', 'Enter', ' '].includes(event.key)) {
      event.preventDefault()
      openAt(fallback)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      openAt(selectedIndex >= 0 ? selectedIndex : options.length - 1)
    } else if (isPrintable(event)) {
      const match = findByTypeahead(event.key)
      openAt(match >= 0 ? match : fallback)
    }
  }

  const handleListKeyDown = (event) => {
    const last = options.length - 1
    const moves = {
      ArrowDown: Math.min(activeIndex + 1, last),
      ArrowUp: Math.max(activeIndex - 1, 0),
      Home: 0,
      End: last,
    }

    if (event.key in moves) {
      event.preventDefault()
      setActiveIndex(moves[event.key])
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      choose(activeIndex)
    } else if (event.key === 'Tab') {
      event.preventDefault()
      close()
    } else if (isPrintable(event)) {
      const match = findByTypeahead(event.key)
      if (match >= 0) setActiveIndex(match)
    }
  }

  // onBlur só quando o foco sai do componente inteiro (botão + lista)
  const handleBlur = (event) => {
    const next = event.relatedTarget
    if (anchorRef.current?.contains(next) || popoverRef.current?.contains(next)) return
    if (open && next) close({ restoreFocus: false })
    onBlur?.()
  }

  const labelledBy = label ? `${labelId} ${valueId}` : undefined

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      {label && (
        <label id={labelId} htmlFor={triggerId} className={styles.label}>
          {label}
        </label>
      )}

      <button
        ref={(node) => {
          anchorRef.current = node
          assignRef(ref, node)
        }}
        id={triggerId}
        type="button"
        className={[styles.trigger, styles[size], error && styles.invalid]
          .filter(Boolean)
          .join(' ')}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-labelledby={labelledBy}
        aria-label={label ? undefined : ariaLabel}
        aria-describedby={error ? errorId : undefined}
        disabled={disabled}
        onClick={() => (open ? close() : openAt(selectedIndex >= 0 ? selectedIndex : 0))}
        onKeyDown={handleTriggerKeyDown}
        onBlur={handleBlur}
      >
        {Icon && <Icon size={17} aria-hidden="true" className={styles.icon} />}
        <span id={valueId} className={selected ? styles.value : styles.placeholder}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} aria-hidden="true" className={styles.chevron} />
      </button>

      {name && <input type="hidden" name={name} value={value ?? ''} />}

      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}

      {open &&
        createPortal(
          <ul
            ref={popoverRef}
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            className={styles.listbox}
            aria-labelledby={label ? labelId : undefined}
            aria-label={label ? undefined : ariaLabel}
            aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
            onKeyDown={handleListKeyDown}
            onClick={(event) => {
              const option = event.target.closest('[role="option"]')
              if (option) choose(Number(option.dataset.index))
            }}
            onBlur={handleBlur}
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                id={`${listboxId}-${index}`}
                data-index={index}
                role="option"
                aria-selected={index === selectedIndex}
                className={[styles.option, index === activeIndex && styles.active]
                  .filter(Boolean)
                  .join(' ')}
                onMouseMove={() => setActiveIndex(index)}
              >
                <span>{option.label}</span>
                {index === selectedIndex && <Check size={14} aria-hidden="true" />}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  )
})

export default Select
