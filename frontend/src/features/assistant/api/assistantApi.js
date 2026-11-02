import { FunctionsHttpError } from '@supabase/supabase-js'

import { supabase } from '@/shared/lib/supabase'

// Assistente de Governança (docs/REGRAS_DE_NEGOCIO.md §5.2): a pergunta vai para
// a Edge Function `assistant`, que confere o limite do dia e pergunta ao Groq.
// Devolve { answer, remaining }.
export async function askAssistant({ organizationId, messages, context }) {
  const { data, error } = await supabase.functions.invoke('assistant', {
    body: { organizationId, messages, context },
  })

  if (error instanceof FunctionsHttpError) {
    const payload = await error.context.json().catch(() => null)
    throw new Error(payload?.error ?? 'O assistente não respondeu. Tente de novo.')
  }

  if (error) throw new Error('Não foi possível falar com o servidor. Tente de novo.')
  return data
}
