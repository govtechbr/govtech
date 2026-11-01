import { supabase } from '@/shared/lib/supabase'

// Membros da organização. Quem pode o quê é decidido no banco (RLS e o trigger
// que impede a organização de ficar sem admin); aqui só se traduz a resposta.

const noPermission = 'Você não tem permissão para alterar este membro.'

function fail(error) {
  // P0001: regra do banco com mensagem pronta (ex.: último administrador)
  if (error.code === 'P0001') throw new Error(error.message)
  if (error.code === 'PGRST116' || error.code === '42501') throw new Error(noPermission)

  throw new Error('Não foi possível falar com o servidor. Tente de novo.')
}

export async function listMembers(organizationId) {
  const { data, error } = await supabase
    .from('organization_members')
    .select('user_id, role, profile:profiles (full_name, email)')
    .eq('organization_id', organizationId)
    .order('created_at')

  if (error) fail(error)
  return data.map(({ user_id: userId, role, profile }) => ({
    userId,
    role,
    name: profile?.full_name || profile?.email || 'Sem nome',
    email: profile?.email ?? '',
  }))
}

export async function updateMemberRole({ organizationId, userId, role }) {
  const { error } = await supabase
    .from('organization_members')
    .update({ role })
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .select('user_id')
    .single()

  if (error) fail(error)
}

export async function removeMember({ organizationId, userId }) {
  const { data, error } = await supabase
    .from('organization_members')
    .delete()
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .select('user_id')

  if (error) fail(error)
  if (data.length === 0) throw new Error(noPermission)
}

export async function regenerateJoinCode(organizationId) {
  const { data, error } = await supabase.rpc('regenerate_join_code', { org: organizationId })

  if (error) fail(error)
  return data
}
