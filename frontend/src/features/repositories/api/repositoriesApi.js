import { supabase } from '@/shared/lib/supabase'

// Dados que a Edge Function `github` sincronizou. Só leitura: o RLS mostra
// apenas o que é da organização do usuário.

function fail() {
  throw new Error('Não foi possível carregar os dados do GitHub. Tente de novo.')
}

function byProject(query, column, projectId) {
  return projectId ? query.eq(column, projectId) : query
}

export async function listRepositoryData(projectId) {
  const [repositories, pullRequests, branches] = await Promise.all([
    byProject(
      supabase
        .from('repositories')
        .select(
          'id, project_id, full_name, name, description, language, html_url, private, pushed_at',
        )
        .order('pushed_at', { ascending: false, nullsFirst: false }),
      'project_id',
      projectId,
    ),
    byProject(
      supabase
        .from('pull_requests')
        .select(
          'id, repository_id, number, title, state, draft, author_login, html_url, created_at_github, merged_at, repository:repositories!inner (name, project_id)',
        )
        .order('updated_at_github', { ascending: false }),
      'repository.project_id',
      projectId,
    ),
    byProject(
      supabase
        .from('branches')
        .select(
          'id, name, last_commit_sha, protected, repository:repositories!inner (name, project_id, default_branch)',
        )
        .order('name'),
      'repository.project_id',
      projectId,
    ),
  ])

  if (repositories.error || pullRequests.error || branches.error) fail()

  return {
    repositories: repositories.data,
    pullRequests: pullRequests.data,
    branches: branches.data,
  }
}
