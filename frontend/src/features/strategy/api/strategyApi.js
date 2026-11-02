import { supabase } from '@/shared/lib/supabase'

// Missão, visão e objetivos estratégicos (docs/REGRAS_DE_NEGOCIO.md §10). Quem pode
// alterar é decidido pelo banco (RLS: só o admin); aqui só se pede.

const noPermission = 'Você não tem permissão para esta ação.'

function fail(error) {
  if (error.code === '42501' || error.code === 'PGRST116') throw new Error(noPermission)

  throw new Error('Não foi possível falar com o servidor. Tente de novo.')
}

export async function getMissionAndVision(organizationId) {
  const { data, error } = await supabase
    .from('organizations')
    .select('mission, vision')
    .eq('id', organizationId)
    .single()

  if (error) fail(error)
  return { mission: data.mission ?? '', vision: data.vision ?? '' }
}

export async function saveMissionAndVision(organizationId, { mission, vision }) {
  const { data, error } = await supabase
    .from('organizations')
    .update({ mission: mission.trim(), vision: vision.trim() })
    .eq('id', organizationId)
    .select('id')

  if (error) fail(error)
  // Sem permissão, o RLS não devolve erro: devolve nenhuma linha alterada
  if (data.length === 0) throw new Error(noPermission)
}

export async function listObjectives(organizationId) {
  const { data, error } = await supabase
    .from('strategic_objectives')
    .select('id, title, description')
    .eq('organization_id', organizationId)
    .order('created_at')

  if (error) fail(error)
  return data
}

export async function createObjective(organizationId, { title, description }) {
  const { error } = await supabase.from('strategic_objectives').insert({
    organization_id: organizationId,
    title: title.trim(),
    description: description.trim(),
  })

  if (error) fail(error)
}

export async function updateObjective(id, { title, description }) {
  const { data, error } = await supabase
    .from('strategic_objectives')
    .update({ title: title.trim(), description: description.trim() })
    .eq('id', id)
    .select('id')

  if (error) fail(error)
  if (data.length === 0) throw new Error(noPermission)
}

export async function deleteObjective(id) {
  const { data, error } = await supabase
    .from('strategic_objectives')
    .delete()
    .eq('id', id)
    .select('id')

  if (error) fail(error)
  if (data.length === 0) throw new Error(noPermission)
}
