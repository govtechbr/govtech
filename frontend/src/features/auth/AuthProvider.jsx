import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { onSessionChange } from '@/features/auth/api/authApi'
import { AuthContext } from '@/features/auth/authContext'

export default function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState(undefined)

  // Assinatura de evento do Supabase (não é busca de dado): a primeira chamada
  // traz a sessão salva e as seguintes chegam a cada login, logout ou renovação
  useEffect(
    () =>
      onSessionChange((nextSession) => {
        // Ao sair, nada do usuário anterior pode ficar em cache para o próximo
        if (!nextSession) {
          queryClient.clear()
        }

        setSession(nextSession)
      }),
    [queryClient],
  )

  return <AuthContext.Provider value={session}>{children}</AuthContext.Provider>
}
