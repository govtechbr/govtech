import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'

import styles from '@/features/auth/components/AuthForms.module.css'
import { useMyOrganizations, useSession } from '@/features/auth/hooks/useAuth'
import { lastOrganizationId, rememberOrganization } from '@/features/auth/utils/lastOrganization'
import { CurrentOrganizationContext } from '@/shared/hooks/useCurrentOrganization'

// Abre a última empresa usada; se ela não existir mais para o usuário, a primeira
function CurrentOrganizationProvider({ userId, organizations }) {
  const [chosenId, setChosenId] = useState(() => lastOrganizationId(userId))
  const organization =
    organizations.find((candidate) => candidate.id === chosenId) ?? organizations[0]

  function switchOrganization(organizationId) {
    rememberOrganization(userId, organizationId)
    setChosenId(organizationId)
  }

  return (
    <CurrentOrganizationContext.Provider
      value={{ organization, organizations, switchOrganization }}
    >
      {/* key: trocar de empresa remonta as telas, sem sobrar nada aberto da anterior */}
      <Outlet key={organization.id} />
    </CurrentOrganizationContext.Provider>
  )
}

// Sem login → /login. Logado mas sem organização → /organizacao.
export default function ProtectedRoute() {
  const session = useSession()
  const organizations = useMyOrganizations()

  if (session === null) {
    return <Navigate to="/login" replace />
  }

  if (session === undefined || organizations.isPending) {
    return (
      <p role="status" className={styles.status}>
        Carregando…
      </p>
    )
  }

  if (organizations.isError) {
    return (
      <p role="alert" className={styles.status}>
        {organizations.error.message} Recarregue a página.
      </p>
    )
  }

  if (organizations.data?.length === 0) {
    return <Navigate to="/organizacao" replace />
  }

  return <CurrentOrganizationProvider userId={session.user.id} organizations={organizations.data} />
}
