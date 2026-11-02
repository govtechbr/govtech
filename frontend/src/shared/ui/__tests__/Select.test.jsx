import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'

import Modal from '@/shared/ui/Modal'
import Select from '@/shared/ui/Select'

const OPTIONS = [
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Média' },
  { value: 'low', label: 'Baixa' },
]

function Harness({ initial = 'medium', onChange = vi.fn(), ...props }) {
  const [value, setValue] = useState(initial)

  return (
    <Select
      label="Prioridade"
      options={OPTIONS}
      value={value}
      onChange={(next) => {
        onChange(next)
        setValue(next)
      }}
      {...props}
    />
  )
}

const trigger = () => screen.getByRole('button', { name: /^Prioridade/ })

describe('Select', () => {
  it('mostra o valor selecionado e liga rótulo e botão', () => {
    render(<Harness />)

    expect(trigger()).toHaveAttribute('aria-haspopup', 'listbox')
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: 'Prioridade Média' })).toBe(trigger())
    expect(screen.getByLabelText('Prioridade')).toBe(trigger())
  })

  it('mostra o placeholder quando não há valor', () => {
    render(<Harness initial="" placeholder="Escolha" />)

    expect(trigger()).toHaveTextContent('Escolha')
  })

  it('abre com clique e escolhe uma opção com o mouse', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)

    await user.click(trigger())

    expect(trigger()).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('option', { name: 'Média' })).toHaveAttribute('aria-selected', 'true')

    await user.click(screen.getByRole('option', { name: 'Baixa' }))

    expect(onChange).toHaveBeenCalledWith('low')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(trigger()).toHaveTextContent('Baixa')
    expect(trigger()).toHaveFocus()
  })

  it('navega pelo teclado: setas, Home/End e Enter', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)

    trigger().focus()
    await user.keyboard('{ArrowDown}')

    const listbox = screen.getByRole('listbox', { name: 'Prioridade' })
    expect(listbox).toHaveFocus()
    expect(listbox).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Média' }).id,
    )

    await user.keyboard('{ArrowDown}')
    expect(listbox).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Baixa' }).id,
    )

    await user.keyboard('{Home}')
    expect(listbox).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Alta' }).id,
    )

    await user.keyboard('{End}{ArrowUp}{ArrowUp}{Enter}')

    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith('high')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('Espaço escolhe a opção ativa', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)

    trigger().focus()
    await user.keyboard('{Enter}{ArrowUp} ')

    expect(onChange).toHaveBeenCalledWith('high')
    expect(trigger()).toHaveFocus()
  })

  it('digitar leva à opção que começa com o texto', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)

    trigger().focus()
    await user.keyboard('b')

    expect(screen.getByRole('listbox')).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Baixa' }).id,
    )

    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith('low')
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
    await user.keyboard('{ArrowDown}{Escape}')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
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

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('não abre quando desabilitado', async () => {
    const user = userEvent.setup()
    render(<Harness disabled />)

    await user.click(trigger())

    expect(trigger()).toBeDisabled()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('mostra o erro ligado ao campo', () => {
    render(<Harness error="Escolha uma prioridade" />)

    expect(trigger()).toHaveAccessibleDescription('Escolha uma prioridade')
  })

  it('aceita aria-label quando não há rótulo visível', () => {
    render(<Select aria-label="Papel de Ana" options={OPTIONS} value="low" onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Papel de Ana' })).toHaveTextContent('Baixa')
  })

  it('funciona com react-hook-form via Controller', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    function Form() {
      const { control, handleSubmit } = useForm({ defaultValues: { priority: 'medium' } })

      return (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => <Select label="Prioridade" options={OPTIONS} {...field} />}
          />
          <button type="submit">Salvar</button>
        </form>
      )
    }

    render(<Form />)

    await user.click(trigger())
    await user.click(screen.getByRole('option', { name: 'Alta' }))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(onSubmit).toHaveBeenCalledWith({ priority: 'high' }, expect.anything())
  })
})
