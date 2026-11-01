import { supabase } from '@/shared/lib/supabase'

// Dados que a Edge Function `github` sincronizou. Só leitura: o RLS mostra
// apenas o que é da empresa do usuário.
//
// Cada repositório existe uma vez por empresa e se liga a projetos pela tabela
// project_repositories. Sem filtro de projeto, nada se repete (regra G4). Com
// filtro, entram os repositórios do projeto, inclusive os compartilhados.
// Sempre só da empresa escolhida (quem está em várias enxerga todas pelo RLS).

function fail() {
  throw new Error('Não foi possível carregar os dados do GitHub. Tente de novo.')
}

const repositoryColumns = 'id, full_name, name, description, language, html_url, private, pushed_at'
const pullRequestColumns =
  'id, repository_id, number, title, state, draft, author_login, approval_count, html_url, created_at_github, merged_at'
const branchColumns = 'id, name, last_commit_sha, protected'

// Com projeto: o join "!inner" deixa só as linhas ligadas a ele
function inProject(projectId, embed) {
  return projectId ? `${embed}!inner (project_id)` : `${embed} (project_id)`
}

export async function listRepositoryData(organizationId, projectId) {
  let repositories = supabase
    .from('repositories')
    .select(`${repositoryColumns}, ${inProject(projectId, 'project_repositories')}`)
    .eq('organization_id', organizationId)
    .order('pushed_at', { ascending: false, nullsFirst: false })

  let pullRequests = supabase
    .from('pull_requests')
    .select(
      `${pullRequestColumns}, repository:repositories!inner (name, ${inProject(projectId, 'project_repositories')})`,
    )
    .eq('organization_id', organizationId)
    .order('updated_at_github', { ascending: false })

  let branches = supabase
    .from('branches')
    .select(
      `${branchColumns}, repository:repositories!inner (name, default_branch, ${inProject(projectId, 'project_repositories')})`,
    )
    .eq('organization_id', organizationId)
    .order('name')

  if (projectId) {
    repositories = repositories.eq('project_repositories.project_id', projectId)
    pullRequests = pullRequests.eq('repository.project_repositories.project_id', projectId)
    branches = branches.eq('repository.project_repositories.project_id', projectId)
  }

  const results = await Promise.all([repositories, pullRequests, branches])

  if (results.some((result) => result.error)) fail()

  const [repositoryRows, pullRequestRows, branchRows] = results.map((result) => result.data)

  return {
    repositories: repositoryRows.map(({ project_repositories: links, ...repository }) => ({
      ...repository,
      projectIds: links.map((link) => link.project_id),
    })),
    pullRequests: pullRequestRows,
    branches: branchRows,
  }
}
