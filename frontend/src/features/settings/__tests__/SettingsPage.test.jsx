import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import SettingsPage from '@/features/settings/SettingsPage'
import { ToastContext } from '@/shared/ui/toastContext'

const settings = {
  organizationName: 'GovTech MS',
  timezone: 'America/Sao_Paulo',
  theme: 'Claro',
  notifications: { deploy: true, critical: false, security: false, weekly: false },
}

function renderPage() {
  return render(
    <ToastContext.Provider value={{ showToast: vi.fn() }}>
      <SettingsPage settings={settings} onSaveSettings={vi.fn()} />
    </ToastContext.Provider>,
  )
}

describe('SettingsPage: abas em desenvolvimento', () => {
  it('marks Notificações as em desenvolvimento with disabled controls and no save button', async () => {
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: 'Notificações' }))

    expect(screen.getByText('Em desenvolvimento')).toBeInTheDocument()
    screen.getAllByRole('button', { name: /(Ativar|Desativar) / }).forEach((toggle) => {
      expect(toggle).toBeDisabled()
    })
    expect(screen.queryByRole('button', { name: 'Salvar preferências' })).not.toBeInTheDocument()
  })

  it('marks Segurança as em desenvolvimento with disabled actions', async () => {
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: 'Segurança' }))

    expect(screen.getByText('Em desenvolvimento')).toBeInTheDocument()
    ;['Ativar', 'Ver 2 sessões', 'Alterar'].forEach((name) => {
      expect(screen.getByRole('button', { name })).toBeDisabled()
    })
  })
})
