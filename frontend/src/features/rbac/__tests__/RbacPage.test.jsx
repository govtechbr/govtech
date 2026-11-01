import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import RbacPage from '@/features/rbac/RbacPage'

describe('RbacPage', () => {
  it('opens a role in an accessible dialog and closes it', async () => {
    const user = userEvent.setup()
    render(<RbacPage />)

    await user.click(screen.getByRole('button', { name: /admin/i }))
    expect(screen.getByRole('dialog', { name: /admin/i })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
