import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import DatePicker from '@/shared/ui/DatePicker'
import Modal from '@/shared/ui/Modal'

function Harness({ initial = '', onChange = vi.fn(), ...props }) {
  const [value, setValue] = useState(initial)

  return (
    <DatePicker
      label="Deadline"
      value={value}
      onChange={(next) => {
        onChange(next)
        setValue(next)
      }}
      {...props}
    />
  )
}

const trigger = () => screen.getByRole('button', { name: /^Deadline/ })
const calendar = () => screen.getByRole('dialog', { name: /de 2026|de 2027/ })
const day = (name) => screen.getByRole('button', { name })

describe('DatePicker', () => {
  beforeEach(() => {
    // Só o relógio é falso: os timers reais continuam para o userEvent
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 2, 10, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('mostra a data em dd/mm/aaaa e o placeholder quando vazio', () => {
    const { unmount } = render(<Harness initial="2026-12-20" />)
    expect(screen.getByLabelText('Deadline')).toHaveTextContent('20/12/2026')
    expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog')
    unmount()

    render(<Harness />)
    expect(trigger()).toHaveTextContent('dd/mm/aaaa')
  })

  it('abre no mês de hoje, com hoje destacado e focado', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(trigger())

    expect(trigger()).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('heading', { name: 'novembro de 2026' })).toBeInTheDocument()
    expect(day('2 de novembro de 2026')).toHaveAttribute('aria-current', 'date')
    expect(day('2 de novembro de 2026')).toHaveFocus()
  })

  it('escolhe um dia com o mouse e navega entre meses', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)

    await user.click(trigger())
    await user.click(screen.getByRole('button', { name: 'Próximo mês' }))
    expect(screen.getByRole('heading', { name: 'dezembro de 2026' })).toBeInTheDocument()

    await user.click(day('20 de dezembro de 2026'))

    expect(onChange).toHaveBeenCalledWith('2026-12-20')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger()).toHaveTextContent('20/12/2026')
    expect(trigger()).toHaveFocus()
  })

  it('abre no mês do valor atual, com o dia marcado como selecionado', async () => {
    const user = userEvent.setup()
    render(<Harness initial="2027-01-15" />)

    await user.click(trigger())

    const selected = within(calendar()).getByRole('gridcell', { selected: true })
    expect(selected).toHaveTextContent('15')
    expect(day('15 de janeiro de 2027')).toHaveFocus()
  })

  it('navega pelo teclado: setas, PageUp/PageDown e Enter', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)

    trigger().focus()
    await user.keyboard('{Enter}')
    expect(day('2 de novembro de 2026')).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(day('3 de novembro de 2026')).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(day('10 de novembro de 2026')).toHaveFocus()

    await user.keyboard('{ArrowUp}{ArrowLeft}')
    expect(day('2 de novembro de 2026')).toHaveFocus()

    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(screen.getByRole('heading', { name: 'outubro de 2026' })).toBeInTheDocument()
    expect(day('31 de outubro de 2026')).toHaveFocus()

    await user.keyboard('{PageDown}')
    expect(day('30 de novembro de 2026')).toHaveFocus()

    await user.keyboard('{PageDown}{PageUp}{Enter}')

    expect(onChange).toHaveBeenCalledWith('2026-11-30')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Esc fecha sem mudar o valor e sem fechar o modal em volta', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onChange = vi.fn()
    render(
      <Modal title="Projeto" onClose={onClose}>
        <Harness onChange={onChange} />
      </Modal>,
    )

    await user.click(trigger())
    await user.keyboard('{ArrowRight}{Escape}')

    expect(screen.queryByRole('dialog', { name: /2026/ })).not.toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
    expect(trigger()).toHaveFocus()
  })

  it('fecha ao clicar fora', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Harness />
        <p>Fora</p>
      </>,
    )

    await user.click(trigger())
    await user.click(screen.getByText('Fora'))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('respeita min e max: dias fora ficam desabilitados e o teclado não passa deles', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} min="2026-11-02" max="2026-11-20" />)

    await user.click(trigger())

    expect(day('1 de novembro de 2026')).toBeDisabled()
    expect(day('21 de novembro de 2026')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Mês anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próximo mês' })).toBeDisabled()

    await user.keyboard('{ArrowLeft}')
    expect(day('2 de novembro de 2026')).toHaveFocus()

    await user.keyboard('{PageDown}{Enter}')
    expect(onChange).toHaveBeenCalledWith('2026-11-20')
  })

  it('abre no min quando hoje é antes dele', async () => {
    const user = userEvent.setup()
    render(<Harness min="2027-03-10" />)

    await user.click(trigger())

    expect(screen.getByRole('heading', { name: 'março de 2027' })).toBeInTheDocument()
    expect(day('10 de março de 2027')).toHaveFocus()
  })

  it('mostra o erro ligado ao campo', () => {
    render(<Harness error="Informe o deadline" />)

    expect(trigger()).toHaveAccessibleDescription('Informe o deadline')
  })

  it('funciona com react-hook-form via Controller', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    function Form() {
      const { control, handleSubmit } = useForm({ defaultValues: { deadline: '' } })

      return (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="deadline"
            control={control}
            render={({ field }) => <DatePicker label="Deadline" {...field} />}
          />
          <button type="submit">Salvar</button>
        </form>
      )
    }

    render(<Form />)

    await user.click(trigger())
    await user.click(day('5 de novembro de 2026'))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(onSubmit).toHaveBeenCalledWith({ deadline: '2026-11-05' }, expect.anything())
  })
})
