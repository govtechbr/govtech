import { supabase } from '@/shared/lib/supabase'

// Cadastro, login e organizações do usuário. Mensagens de erro já saem em
// pt-BR, prontas para a tela; o código técnico fica só no console do Supabase.

const authMessages = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  email_not_confirmed: 'Confirme seu e-mail antes de entrar (veja sua caixa de entrada).',
  user_already_exists: 'Este e-mail já tem cadastro. Tente entrar.',
  weak_password: 'Senha fraca. Use pelo menos 8 caracteres.',
  over_email_send_rate_limit: 'Muitos cadastros seguidos. Aguarde alguns minutos.',
  over_request_rate_limit: 'Muitas tentativas seguidas. Aguarde alguns minutos.',
}

function authError(error) {
  return new Error(authMessages[error.code] ?? 'Não foi possível concluir. Tente de novo.')
}

export function onSessionChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session))

  return () => data.subscription.unsubscribe()
}

export async function signIn({ email, password }) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) throw authError(error)
}

// Devolve true quando a conta já entra direto; false quando falta confirmar o e-mail
export async function signUp({ fullName, email, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${window.location.origin}/dashboard`,
    },
  })

  if (error) throw authError(error)
  return Boolean(data.session)
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) throw authError(error)
}

export async function listMyOrganizations(userId) {
  const { data, error } = await supabase
    .from('organization_members')
    .select('role, organization:organizations (id, name, join_code)')
    .eq('user_id', userId)
    .order('created_at')

  if (error) throw new Error('Não foi possível carregar suas organizações.')
  return data.map(({ role, organization: { join_code: joinCode, ...organization } }) => ({
    ...organization,
    joinCode,
    role,
  }))
}

export async function createOrganization(name) {
  const { data, error } = await supabase.rpc('create_organization', { org_name: name })

  if (error) throw new Error('Não foi possível criar a organização. Tente de novo.')
  return data
}

export async function joinOrganization(code) {
  const { data, error } = await supabase.rpc('join_organization', { code })

  // P0002: código inválido (o banco não diz se a organização existe)
  if (error?.code === 'P0002') throw new Error('Código de organização inválido.')
  if (error) throw new Error('Não foi possível entrar na organização. Tente de novo.')
  return data
}
