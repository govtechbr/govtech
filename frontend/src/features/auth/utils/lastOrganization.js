import { storageKeys } from '@/shared/constants/storageKeys'

// Última empresa usada, por usuário, neste navegador (regra A5).
// Formato: { [userId]: organizationId }

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(storageKeys.LAST_ORGANIZATION)) ?? {}
  } catch {
    return {}
  }
}

export function lastOrganizationId(userId) {
  return readAll()[userId] ?? null
}

export function rememberOrganization(userId, organizationId) {
  try {
    localStorage.setItem(
      storageKeys.LAST_ORGANIZATION,
      JSON.stringify({ ...readAll(), [userId]: organizationId }),
    )
  } catch (error) {
    console.error('Erro ao salvar a última empresa:', error)
  }
}
