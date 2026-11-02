import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { forwardRef, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { usePopover } from '@/shared/hooks/usePopover'
import {
  addDays,
  addMonths,
  clampIsoDay,
  formatIsoDay,
  formatLongDay,
  formatMonthYear,
  isIsoDay,
  monthWeeks,
  startOfMonth,
  todayIso,
  WEEKDAYS,
} from '@/shared/lib/date'
import styles from './DatePicker.module.css'

const KEY_MOVES = {
  ArrowLeft: (day) => addDays(day, -1),
  ArrowRight: (day) => addDays(day, 1),
  ArrowUp: (day) => addDays(day, -7),
  ArrowDown: (day) => addDays(day, 7),
  PageUp: (day) => addMonths(day, -1),
  PageDown: (day) => addMonths(day, 1),
}

const FOCUSABLE = 'button:not([disabled])[tabindex="0"], button:not([disabled]):not([tabindex])'

function assignRef(ref, node) {
  if (typeof ref === 'function') ref(node)
  else if (ref) ref.current = node
}

// Campo de data no estilo do sistema: abre um calendário mensal em popover.
// value/onChange usam "YYYY-MM-DD" (mesmo contrato do <input type="date">);
// onChange recebe o valor (não o evento): com react-hook-form, use via <Controller>.
const DatePicker = forwardRef(function DatePicker(
  {
    label,
    value,
    onChange,
    onBlur,
    min,
    max,
    disabled = false,
    placeholder = 'dd/mm/aaaa',
    name,
    id,
    error,
    className,
  },
  ref,
) {
  const generatedId = useId()
  const triggerId = id || `${generatedId}-trigger`
  const labelId = `${generatedId}-label`
  const valueId = `${generatedId}-value`
  const dialogId = `${generatedId}-dialog`
  const titleId = `${generatedId}-title`
  const errorId = `${generatedId}-error`

  const selected = isIsoDay(value) ? value : null
  const [open, setOpen] = useState(false)
  const [focusedDay, setFocusedDay] = useState(null)
  const moveFocusToGrid = useRef(false)

  const close = ({ restoreFocus = true } = {}) => {
    setOpen(false)
    if (restoreFocus) anchorRef.current?.focus()
  }

  const { anchorRef, popoverRef } = usePopover({ open, onClose: close })

  // Ao abrir e ao navegar pelo teclado, o foco vai para o dia ativo
  useEffect(() => {
    if (!open || !moveFocusToGrid.current) return
    moveFocusToGrid.current = false
    popoverRef.current?.querySelector('[data-focused="true"]')?.focus()
  }, [open, focusedDay, popoverRef])

  const today = todayIso()
  const isOutOfRange = (day) => Boolean((min && day < min) || (max && day > max))

  const openCalendar = () => {
    if (disabled) return
    moveFocusToGrid.current = true
    setFocusedDay(clampIsoDay(selected || today, min, max))
    setOpen(true)
  }

  const choose = (day) => {
    if (isOutOfRange(day)) return
    if (day !== selected) onChange?.(day)
    close()
  }

  const goToMonth = (amount) => {
    setFocusedDay((day) => clampIsoDay(addMonths(day, amount), min, max))
  }

  // Setas e PageUp/PageDown movem o dia ativo; Tab circula dentro do calendário
  const handleDialogKeyDown = (event) => {
    const move = KEY_MOVES[event.key]
    if (move && 'focused' in event.target.dataset) {
      event.preventDefault()
      moveFocusToGrid.current = true
      setFocusedDay((day) => clampIsoDay(move(day), min, max))
      return
    }

    if (event.key !== 'Tab') return
    const focusable = [...popoverRef.current.querySelectorAll(FOCUSABLE)]
    const index = focusable.indexOf(document.activeElement)
    const next = event.shiftKey ? index - 1 : index + 1
    event.preventDefault()
    focusable[(next + focusable.length) % focusable.length]?.focus()
  }

  // onBlur só quando o foco sai do componente inteiro (botão + calendário)
  const handleBlur = (event) => {
    const next = event.relatedTarget
    if (anchorRef.current?.contains(next) || popoverRef.current?.contains(next)) return
    if (open && next) close({ restoreFocus: false })
    onBlur?.()
  }

  const month = focusedDay && startOfMonth(focusedDay)
  const canGoBack = month && (!min || addDays(month, -1) >= min)
  const canGoForward = month && (!max || addMonths(month, 1) <= max)

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
        className={[styles.trigger, error && styles.invalid].filter(Boolean).join(' ')}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        aria-labelledby={label ? `${labelId} ${valueId}` : undefined}
        aria-describedby={error ? errorId : undefined}
        disabled={disabled}
        onClick={() => (open ? close() : openCalendar())}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !open) {
            event.preventDefault()
            openCalendar()
          }
        }}
        onBlur={handleBlur}
      >
        <span id={valueId} className={selected ? styles.value : styles.placeholder}>
          {selected ? formatIsoDay(selected) : placeholder}
        </span>
        <CalendarDays size={16} aria-hidden="true" className={styles.icon} />
      </button>

      {name && <input type="hidden" name={name} value={selected ?? ''} />}

      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}

      {open &&
        createPortal(
          // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- teclado do calendário
          <div
            ref={popoverRef}
            id={dialogId}
            role="dialog"
            aria-modal="false"
            aria-labelledby={titleId}
            className={styles.popover}
            onKeyDown={handleDialogKeyDown}
            onBlur={handleBlur}
          >
            <div className={styles.header}>
              <button
                type="button"
                className={styles.nav}
                aria-label="Mês anterior"
                disabled={!canGoBack}
                onClick={() => goToMonth(-1)}
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>

              <h2 id={titleId} className={styles.title} aria-live="polite">
                {formatMonthYear(month)}
              </h2>

              <button
                type="button"
                className={styles.nav}
                aria-label="Próximo mês"
                disabled={!canGoForward}
                onClick={() => goToMonth(1)}
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>

            <table role="grid" aria-labelledby={titleId} className={styles.grid}>
              <thead>
                <tr>
                  {WEEKDAYS.map((weekday) => (
                    <th key={weekday.long} scope="col" abbr={weekday.long}>
                      {weekday.short}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {monthWeeks(month).map((week) => (
                  <tr key={week.find(Boolean)}>
                    {week.map((day, index) =>
                      day ? (
                        <td key={day} role="gridcell" aria-selected={day === selected}>
                          <button
                            type="button"
                            className={styles.day}
                            tabIndex={day === focusedDay ? 0 : -1}
                            data-focused={day === focusedDay}
                            aria-label={formatLongDay(day)}
                            aria-current={day === today ? 'date' : undefined}
                            disabled={isOutOfRange(day)}
                            onClick={() => choose(day)}
                          >
                            {Number(day.slice(8, 10))}
                          </button>
                        </td>
                      ) : (
                        <td key={`empty-${index}`} role="gridcell" />
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
          document.body,
        )}
    </div>
  )
})

export default DatePicker
