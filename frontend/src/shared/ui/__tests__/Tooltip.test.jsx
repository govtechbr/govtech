import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import Tooltip from '@/shared/ui/Tooltip'

function renderTooltip() {
  const user = userEvent.setup()

  render(
    <>
      <Tooltip label="Como é calculado">Média dos projetos.</Tooltip>
      <button type="button">Outro</button>
    </>,
  )

  return { user, trigger: screen.getByRole('button', { name: 'Como é calculado' }) }
}

describe('Tooltip', () => {
  it('starts closed and still describes the button', () => {
    const { trigger } = renderTooltip()

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    expect(trigger).toHaveAccessibleDescription('Média dos projetos.')
  })

  it('opens on hover and closes when the pointer leaves', async () => {
    const { user, trigger } = renderTooltip()

    await user.hover(trigger)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Média dos projetos.')

    await user.unhover(trigger)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('opens on keyboard focus and closes on blur', async () => {
    const { user } = renderTooltip()

    await user.tab()
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    await user.tab()
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('closes with Escape', async () => {
    const { user } = renderTooltip()

    await user.tab()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('opens on tap and closes on a tap outside', async () => {
    const { user, trigger } = renderTooltip()

    await user.pointer({ keys: '[TouchA]', target: trigger })
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    await user.pointer({ keys: '[TouchA]', target: document.body })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})
