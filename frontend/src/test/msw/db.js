import { projects as mockProjects } from '@/mocks/mockData'

// Banco em memória usado pelos handlers do MSW. Volta ao estado inicial a cada teste.

export const testUser = {
  id: '00000000-0000-0000-0000-00000000000a',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'alice@test.local',
  user_metadata: { full_name: 'Alice Souza' },
}

// Colega de organização (developer), para a tela de membros
export const colleague = {
  id: '00000000-0000-0000-0000-00000000000b',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'bruno@test.local',
  user_metadata: { full_name: 'Bruno Lima' },
}

export const testPassword = 'senha-certa'
export const testOrganization = {
  id: '10000000-0000-0000-0000-00000000000a',
  name: 'Org A',
  join_code: 'CODEA00001',
}
export const otherOrganization = {
  id: '10000000-0000-0000-0000-00000000000b',
  name: 'Org B',
  join_code: 'CODEB00001',
}

export const db = {}

export function resetDb({ withOrganization = true } = {}) {
  db.users = [testUser, colleague]
  // Cópias: um teste que gera novo código não muda o próximo
  db.organizations = [{ ...testOrganization }, { ...otherOrganization }]
  db.members = withOrganization
    ? [
        { organization_id: testOrganization.id, user_id: testUser.id, role: 'admin' },
        { organization_id: testOrganization.id, user_id: colleague.id, role: 'developer' },
      ]
    : []
  db.projects = mockProjects.map((project, index) => ({
    ...project,
    id: `20000000-0000-0000-0000-${String(index).padStart(12, '0')}`,
    organization_id: testOrganization.id,
  }))
}

resetDb()

export function sessionFor(user) {
  const expiresIn = 3600

  return {
    access_token: `token-${user.id}`,
    token_type: 'bearer',
    expires_in: expiresIn,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    refresh_token: `refresh-${user.id}`,
    user,
  }
}

// Simula uma sessão já salva no navegador (o client lê esta chave ao iniciar)
export function signInAs(user = testUser) {
  localStorage.setItem('govtech-auth', JSON.stringify(sessionFor(user)))
}
