import { useContext } from 'react'
import { useQuery } from '@tanstack/react-query'

import { listMyOrganizations } from '@/features/auth/api/authApi'
import { AuthContext } from '@/features/auth/authContext'

export function useSession() {
  return useContext(AuthContext)
}

export const organizationsKey = ['organizations']

// Busca de novo ao voltar para a aba e a cada minuto: quem foi removido por um admin
// sai da empresa sem precisar recarregar (ProtectedRoute leva à outra ou a /organizacao)
const ORGANIZATIONS_REFRESH_MS = 60_000

export function useMyOrganizations() {
  const userId = useSession()?.user.id

  return useQuery({
    queryKey: [...organizationsKey, userId],
    queryFn: () => listMyOrganizations(userId),
    enabled: Boolean(userId),
    refetchOnWindowFocus: 'always',
    refetchInterval: ORGANIZATIONS_REFRESH_MS,
  })
}
