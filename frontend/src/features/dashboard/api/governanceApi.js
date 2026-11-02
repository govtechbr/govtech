import { supabase } from '@/shared/lib/supabase'

// Dados da Visão geral, só da empresa escolhida. Só leitura: o RLS garante que
// são da empresa do usuário; o filtro tira as outras empresas de quem está em várias.

// Commits guardados no banco: os dos últimos 90 dias (maior período da tela)
const COMMIT_DAYS = 90
const links = 'project_repositories (project_id)'

const projectIds = (rows) => rows.map((row) => row.project_id)

export async function loadGovernanceData(organizationId, now = new Date()) {
  const since = new Date(now.getTime() - COMMIT_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const results = await Promise.all([
    supabase
      .from('repositories')
      .select(`id, name, default_branch, ${links}`)
      .eq('organization_id', organizationId),
    supabase
      .from('pull_requests')
      .select(
        `id, number, title, state, draft, author_login, approval_count, html_url, created_at_github, merged_at, closed_at, repository:repositories!inner (name, ${links})`,
      )
      .eq('organization_id', organizationId),
    supabase
      .from('branches')
      .select('repository_id, name, protected')
      .eq('organization_id', organizationId),
    supabase
      .from('commits')
      .select('repository_id, author_login, committed_at')
      .eq('organization_id', organizationId)
      .gte('committed_at', since),
  ])

  if (results.some((result) => result.error)) {
    throw new Error('Não foi possível carregar os dados do GitHub. Tente de novo.')
  }

  const [repositories, pullRequests, branches, commits] = results.map((result) => result.data)

  return {
    repositories: repositories.map(({ project_repositories: rows, ...repository }) => ({
      ...repository,
      projectIds: projectIds(rows),
    })),
    pullRequests: pullRequests.map(({ repository, ...pr }) => ({
      ...pr,
      repositoryName: repository.name,
      projectIds: projectIds(repository.project_repositories),
    })),
    branches,
    commits,
  }
}
