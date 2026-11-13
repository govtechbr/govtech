import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import LandingPage from '@/landing/LandingPage'

describe('LandingPage', () => {
  it('cites only the frameworks the platform actually uses', () => {
    const { container } = render(<LandingPage />)
    const text = container.textContent

    expect(screen.getByRole('heading', { level: 3, name: 'CMMI-DEV 1.3' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 3, name: 'ISO/IEC 33000 e 12207' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 3, name: 'ISO/IEC 38500 e COBIT' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Métricas DORA' })).toBeInTheDocument()

    expect(text).not.toMatch(/ITIL/)
    expect(text).not.toMatch(/SPICE\/MMI/)
    expect(text).not.toMatch(/GitHub Actions executa/)
  })

  it('states that the platform gives supporting evidence, not a maturity assessment', () => {
    render(<LandingPage />)

    expect(screen.getByText(/não avaliação formal de maturidade/i)).toBeInTheDocument()
  })

  it('links only to pages that exist', () => {
    render(<LandingPage />)

    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'))

    expect(hrefs).toContain('/login')
    expect(hrefs).toContain('/cadastro')
    expect(hrefs.every((href) => /^\/(landing#.+|login|cadastro)?$/.test(href))).toBe(true)
  })
})
