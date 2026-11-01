import { createClient } from '@supabase/supabase-js'

// Único lugar que cria o client. Só os arquivos de features/*/api/ importam
// daqui (regra do ESLint); componentes e hooks nunca falam com o banco direto.

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !publishableKey) {
  throw new Error(
    'Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY (veja frontend/.env.example).',
  )
}

export const supabase = createClient(url, publishableKey, {
  auth: { storageKey: 'govtech-auth' },
})
