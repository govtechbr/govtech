// Edge Function `assistant`: Assistente de Governança com IA (docs/REGRAS_DE_NEGOCIO.md
// §5.2). Roda no Deno do Supabase, com verify_jwt ligado.
//
// O front manda a pergunta, as últimas mensagens da conversa e os dados da
// empresa já calculados na tela (os mesmos números dos painéis). Aqui:
// confere login e se a pessoa é membro da empresa, conta a pergunta no limite
// do dia (IA3) e pergunta ao Groq. Nada da conversa é guardado (IA4).
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'

import { answerText, buildMessages, InvalidRequest, validateRequest } from './prompt.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Regra IA3
const USER_DAILY_LIMIT = 20
const TOTAL_DAILY_LIMIT = 200

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'openai/gpt-oss-120b'
const TIMEOUT_MS = 25_000

class RequestError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function serverKey() {
  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS')

  return secretKeys ? JSON.parse(secretKeys).default : Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
}

function publishableKey() {
  const keys = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')

  return keys ? JSON.parse(keys).default : Deno.env.get('SUPABASE_ANON_KEY')
}

// Confere login e se a pessoa é membro da empresa (o RLS só mostra as dela)
async function authorize(request, organizationId) {
  const url = Deno.env.get('SUPABASE_URL')
  const asUser = createClient(url, publishableKey(), {
    global: { headers: { Authorization: request.headers.get('Authorization') ?? '' } },
    auth: { persistSession: false },
  })

  const { data: userData } = await asUser.auth.getUser()
  const user = userData?.user
  if (!user) throw new RequestError('Faça login de novo.', 401)

  const { data: member } = await asUser
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!member) throw new RequestError('Você não faz parte desta empresa.', 403)

  return user
}

// Conta a pergunta; devolve quantas restam hoje ou lança 429 (IA3)
async function consume(userId) {
  const asServer = createClient(Deno.env.get('SUPABASE_URL'), serverKey(), {
    auth: { persistSession: false },
  })
  const { data: remaining, error } = await asServer.rpc('assistant_consume', {
    p_user_id: userId,
    p_user_limit: USER_DAILY_LIMIT,
    p_total_limit: TOTAL_DAILY_LIMIT,
  })

  if (error) {
    console.error(error)
    throw new RequestError('Erro ao falar com o banco. Tente de novo.', 500)
  }
  if (remaining === null) {
    throw new RequestError(
      `Limite de perguntas de hoje atingido (${USER_DAILY_LIMIT} por pessoa). Volte amanhã.`,
      429,
    )
  }

  return remaining
}

async function ask(context, messages) {
  const apiKey = Deno.env.get('GROQ_API_KEY')
  if (!apiKey) throw new RequestError('O assistente ainda não foi configurado.', 503)

  let response
  try {
    response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: buildMessages(context, messages),
        temperature: 0.3,
        max_tokens: 700,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    throw new RequestError('O assistente demorou para responder. Tente de novo.', 504)
  }

  if (response.status === 429) {
    throw new RequestError('O assistente está sem cota agora. Tente em alguns minutos.', 503)
  }
  if (!response.ok) {
    console.error('Groq', response.status, await response.text())
    throw new RequestError('O assistente não respondeu. Tente de novo em alguns minutos.', 502)
  }

  const answer = answerText(await response.json())
  if (!answer) throw new RequestError('O assistente não soube responder. Reformule a pergunta.', 502)

  return answer
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Use POST.' }, 405)

  try {
    const { organizationId, messages, context } = validateRequest(await request.json())
    const user = await authorize(request, organizationId)
    const remaining = await consume(user.id)

    return json({ answer: await ask(context, messages), remaining })
  } catch (error) {
    if (error instanceof RequestError) return json({ error: error.message }, error.status)
    if (error instanceof InvalidRequest) return json({ error: error.message }, 400)

    console.error(error)
    return json({ error: 'Erro inesperado. Tente de novo.' }, 500)
  }
})
