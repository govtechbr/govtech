import { normalizeProject } from '@/shared/lib/projectUtils'
import { supabase } from '@/shared/lib/supabase'

// Único ponto de acesso aos dados de projeto. As regras de quem vê e quem
// altera ficam no banco (RLS): aqui só se pede, e o banco decide.

// Sem `status`: o status é calculado pelos alertas (regra P3); a coluna antiga fica sem uso
const columns = ['name', 'description', 'deadline', 'owner', 'priority', 'progress']
const selectColumns = ['id', ...columns].join(', ')

// Normaliza só os campos enviados, para uma edição parcial não sobrescrever o resto
function toRow(data) {
  const normalized = normalizeProject(data)
  const row = Object.fromEntries(
    columns.filter((column) => column in data).map((column) => [column, normalized[column]]),
  )

  if ('deadline' in row) {
    row.deadline = row.deadline || null
  }

  return row
}

const notFound = 'Projeto não encontrado ou sem permissão para alterá-lo.'

function fail(error) {
  // PGRST116: nenhuma linha voltou. Com RLS, isso também é o que acontece quando
  // o usuário não pode alterar o projeto: o banco não diz qual dos dois foi.
  if (error.code === 'PGRST116') {
    throw new Error(notFound)
  }

  if (error.code === '42501') {
    throw new Error('Você não tem permissão para esta ação.')
  }

  throw new Error('Não foi possível falar com o servidor. Tente de novo.')
}

// Quem está em várias empresas enxerga (pelo RLS) os projetos de todas; a tela
// mostra só os da empresa escolhida
export async function listProjects(organizationId) {
  const { data, error } = await supabase
    .from('projects')
    .select(selectColumns)
    .eq('organization_id', organizationId)
    .order('created_at')

  if (error) fail(error)
  return data.map((project) => normalizeProject(project))
}

export async function createProject(organizationId, data) {
  const { data: created, error } = await supabase
    .from('projects')
    .insert({ ...toRow(normalizeProject(data)), organization_id: organizationId })
    .select(selectColumns)
    .single()

  if (error) fail(error)
  return normalizeProject(created)
}

export async function updateProject(id, data) {
  const { data: updated, error } = await supabase
    .from('projects')
    .update(toRow(data))
    .eq('id', id)
    .select(selectColumns)
    .single()

  if (error) fail(error)
  return normalizeProject(updated)
}

export async function deleteProject(id) {
  const { data, error } = await supabase.from('projects').delete().eq('id', id).select('id')

  if (error) fail(error)
  if (data.length === 0) throw new Error(notFound)
}
