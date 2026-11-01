import { useContext } from 'react'
import { useQuery } from '@tanstack/react-query'

import { listMyOrganizations } from '@/features/auth/api/authApi'
import { AuthContext } from '@/features/auth/authContext'

export function useSession() {
  return useContext(AuthContext)
}

export const organizationsKey = ['organizations']

export function useMyOrganizations() {
  const userId = useSession()?.user.id

  return useQuery({
    queryKey: [...organizationsKey, userId],
    queryFn: () => listMyOrganizations(userId),
    enabled: Boolean(userId),
  })
}
