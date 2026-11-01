import { Navigate, Outlet } from 'react-router-dom'

import styles from '@/features/auth/components/AuthForms.module.css'
import { useMyOrganizations, useSession } from '@/features/auth/hooks/useAuth'

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

  return <Outlet />
}
