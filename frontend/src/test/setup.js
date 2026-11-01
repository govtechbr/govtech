import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'

import { resetDb } from '@/test/msw/db'
import { server } from '@/test/msw/server'

// Toda chamada de rede precisa de um handler: nenhum teste fala com o Supabase real
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterEach(() => {
  cleanup()
  localStorage.clear()
  server.resetHandlers()
  resetDb()
})

afterAll(() => server.close())
