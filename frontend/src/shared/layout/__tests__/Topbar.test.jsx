import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Topbar from '@/shared/layout/Topbar'

describe('Topbar', () => {
  it('shows the notifications bell disabled as em desenvolvimento', () => {
    render(
      <Topbar
        active="Visão geral"
        setOpen={vi.fn()}
        onOpenSearch={vi.fn()}
        accountMenuOpen={false}
        setAccountMenuOpen={vi.fn()}
        onNavigate={vi.fn()}
        account={{ name: 'Guilherme', initials: 'GK', role: 'Admin' }}
        onSignOut={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /Notificações.*em desenvolvimento/ })).toBeDisabled()
  })
})
