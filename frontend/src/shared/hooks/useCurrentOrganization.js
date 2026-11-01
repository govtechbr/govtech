import { createContext, useContext } from 'react'

// Empresa escolhida na barra lateral (regra A5). Quem fornece é o ProtectedRoute;
// as features leem daqui para buscar só os dados dessa empresa.
// Valor: { organization, organizations, switchOrganization }
export const CurrentOrganizationContext = createContext(null)

export function useCurrentOrganization() {
  return useContext(CurrentOrganizationContext)
}
