import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import Modal from '@/shared/ui/Modal'

function Harness({ onClose = vi.fn() }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir
      </button>

      {open && (
        <Modal
          title="Detalhes"
          kicker="PROJETO"
          onClose={() => {
            onClose()
            setOpen(false)
          }}
        >
          <button type="button">Primeira ação</button>
          <button type="button">Segunda ação</button>
        </Modal>
      )}
    </>
  )
}

async function openModal(props) {
  const user = userEvent.setup()
  render(<Harness {...props} />)
  await user.click(screen.getByRole('button', { name: 'Abrir' }))

  return user
}

describe('Modal', () => {
  it('renders an accessible dialog named by its title', async () => {
    await openModal()

    const dialog = screen.getByRole('dialog', { name: 'Detalhes' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByText('PROJETO')).toBeInTheDocument()
  })

  it('moves focus into the dialog when it opens', async () => {
    await openModal()

    expect(screen.getByRole('dialog')).toContainElement(document.activeElement)
  })

  it('closes with Escape and returns focus to the trigger', async () => {
    const onClose = vi.fn()
    const user = await openModal({ onClose })

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Abrir' })).toHaveFocus()
  })

  it('closes with the close button', async () => {
    const onClose = vi.fn()
    const user = await openModal({ onClose })

    await user.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('keeps Tab focus inside the dialog', async () => {
    const user = await openModal()
    const dialog = screen.getByRole('dialog')

    for (let i = 0; i < 5; i += 1) {
      await user.tab()
      expect(dialog).toContainElement(document.activeElement)
    }
  })
})
