import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

export function renderWithRouter(ui, { route = '/' } = {}) {
  return {
    user: userEvent.setup(),
    ...render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>),
  }
}
