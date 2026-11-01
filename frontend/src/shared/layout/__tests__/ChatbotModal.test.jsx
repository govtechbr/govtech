import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import ChatbotModal from '@/shared/layout/ChatbotModal'

describe('ChatbotModal', () => {
  it('is an accessible dialog that expands FAQ answers and closes with Escape', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<ChatbotModal onClose={onClose} />)

    expect(screen.getByRole('dialog', { name: 'Assistente GovTech' })).toBeInTheDocument()

    const question = screen.getByRole('button', { name: /o que é o govtech/i })
    expect(question).toHaveAttribute('aria-expanded', 'false')
    await user.click(question)
    expect(question).toHaveAttribute('aria-expanded', 'true')

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })
})
