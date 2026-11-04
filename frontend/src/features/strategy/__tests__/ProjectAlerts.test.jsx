import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import ProjectAlerts from '@/features/strategy/components/ProjectAlerts'

function makeAlerts(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `alert-${index + 1}`,
    title: `Alerta ${index + 1}`,
    detail: `Detalhe ${index + 1}`,
  }))
}

describe('ProjectAlerts (S5)', () => {
  it('says there are no alerts', () => {
    render(<ProjectAlerts alerts={[]} />)

    expect(screen.getByText('Sem alertas.')).toBeInTheDocument()
  })

  it('shows every alert when the list is short, without a toggle', () => {
    render(<ProjectAlerts alerts={makeAlerts(3)} />)

    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('shows only the first alerts and expands on demand', async () => {
    const user = userEvent.setup()
    render(<ProjectAlerts alerts={makeAlerts(12)} />)

    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByText('Alerta 1')).toBeInTheDocument()
    expect(screen.queryByText('Alerta 4')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Ver todos os 12 alertas' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(12)

    await user.click(screen.getByRole('button', { name: 'Mostrar menos' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })
})
