import { supabase } from '@/shared/lib/supabase'

// Dados da Visão geral, só da empresa escolhida. Só leitura: o RLS garante que
// são da empresa do usuário; o filtro tira as outras empresas de quem está em várias.

// Commits guardados no banco: os dos últimos 90 dias (maior período da tela)
const COMMIT_DAYS = 90
const SCORE_DAYS = 31
const DAY = 24 * 60 * 60 * 1000
const links = 'project_repositories (project_id)'

const projectIds = (rows) => rows.map((row) => row.project_id)

export async function loadGovernanceData(organizationId, now = new Date()) {
  const since = new Date(now.getTime() - COMMIT_DAYS * DAY).toISOString()

  const results = await Promise.all([
    supabase
      .from('repositories')
      .select(`id, name, default_branch, ci_state, ${links}`)
      .eq('organization_id', organizationId),
    supabase
      .from('pull_requests')
      .select(
        `id, number, title, state, draft, author_login, approval_count, ci_state, html_url, created_at_github, merged_at, closed_at, repository:repositories!inner (name, ${links})`,
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
    // Índice de Governança: a Edge Function grava um dia por projeto; a tela mostra 30
    supabase
      .from('governance_scores')
      .select('project_id, day, score, components, reconstructed, computed_at')
      .eq('organization_id', organizationId)
      .gte('day', new Date(now.getTime() - SCORE_DAYS * DAY).toISOString().slice(0, 10))
      .order('day'),
  ])

  if (results.some((result) => result.error)) {
    throw new Error('Não foi possível carregar os dados do GitHub. Tente de novo.')
  }

  const [repositories, pullRequests, branches, commits, scores] = results.map(
    (result) => result.data,
  )

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
    scores,
  }
}
