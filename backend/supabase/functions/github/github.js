// Conversa com a API do GitHub e converte as respostas em linhas do banco.
// Sem dependência do Deno nem do Supabase: testado com `node --test`.

const API = 'https://api.github.com'
const PAGE = 'per_page=100'

export class GitHubError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

// Mensagem em pt-BR para cada falha que o usuário pode resolver
export function githubErrorMessage(status, rateLimitRemaining) {
  if (status === 401)
    return 'Chave do GitHub inválida ou expirada. Gere uma nova e conecte de novo.'
  if (status === 403 && rateLimitRemaining === '0') {
    return 'Limite de chamadas do GitHub atingido. Tente de novo em alguns minutos.'
  }
  if (status === 403 || status === 404) {
    return 'A chave não tem permissão para ler este repositório. Confira as permissões no GitHub.'
  }
  return 'O GitHub não respondeu. Tente de novo em alguns minutos.'
}

export async function githubGet(token, path, fetchImpl = fetch, init = {}) {
  let response

  try {
    response = await fetchImpl(`${API}${path}`, {
      ...init,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'govtech-ms',
      },
    })
  } catch {
    throw new GitHubError(githubErrorMessage(0), 502)
  }

  if (!response.ok) {
    const remaining = response.headers.get('x-ratelimit-remaining')
    throw new GitHubError(githubErrorMessage(response.status, remaining), response.status)
  }

  return response.json()
}

// A API GraphQL responde 200 mesmo com erro; o erro vem no corpo
export async function githubGraphql(token, query, variables, fetchImpl = fetch) {
  const body = await githubGet(token, '/graphql', fetchImpl, {
    method: 'POST',
    body: JSON.stringify({ query, variables }),
  })

  if (body.errors?.length) {
    const forbidden = body.errors.some(({ type }) => type === 'FORBIDDEN' || type === 'NOT_FOUND')
    throw new GitHubError(githubErrorMessage(forbidden ? 403 : 500), forbidden ? 403 : 502)
  }

  return body.data
}

// Repositório é guardado uma vez por empresa (o vínculo com projetos é outra tabela)
export function toRepositoryRow(repo, { organizationId }) {
  return {
    organization_id: organizationId,
    github_id: repo.id,
    full_name: repo.full_name,
    name: repo.name,
    description: repo.description ?? null,
    language: repo.language ?? null,
    default_branch: repo.default_branch ?? null,
    html_url: repo.html_url,
    private: Boolean(repo.private),
    pushed_at: repo.pushed_at ?? null,
    synced_at: new Date().toISOString(),
  }
}

// Os 100 PRs atualizados por último, já com o número de aprovações (regra G7)
const pullRequestsQuery = `
  query ($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      pullRequests(first: 100, orderBy: { field: UPDATED_AT, direction: DESC }) {
        nodes {
          number
          title
          state
          isDraft
          url
          createdAt
          updatedAt
          mergedAt
          closedAt
          author { login avatarUrl }
          reviews(states: APPROVED) { totalCount }
        }
      }
    }
  }
`

// GraphQL: OPEN, CLOSED ou MERGED
export function pullRequestState(pr) {
  return pr.state.toLowerCase()
}

// Do autor, só login e avatar (LGPD)
export function toPullRequestRow(pr, { repositoryId, organizationId }) {
  return {
    repository_id: repositoryId,
    organization_id: organizationId,
    number: pr.number,
    title: pr.title,
    state: pullRequestState(pr),
    draft: Boolean(pr.isDraft),
    author_login: pr.author?.login ?? null,
    author_avatar_url: pr.author?.avatarUrl ?? null,
    approval_count: pr.reviews?.totalCount ?? 0,
    html_url: pr.url,
    created_at_github: pr.createdAt,
    updated_at_github: pr.updatedAt,
    merged_at: pr.mergedAt ?? null,
    closed_at: pr.closedAt ?? null,
  }
}

// Do commit, nada de nome, e-mail ou mensagem (LGPD): só quem (login do GitHub,
// quando o e-mail tem conta) e quando entrou na branch
export function toCommitRow(commit, { repositoryId, organizationId }) {
  return {
    repository_id: repositoryId,
    organization_id: organizationId,
    sha: commit.sha,
    author_login: commit.author?.login ?? null,
    author_avatar_url: commit.author?.avatar_url ?? null,
    committed_at: commit.commit.committer.date,
  }
}

export function toBranchRow(branch, { repositoryId, organizationId }) {
  return {
    repository_id: repositoryId,
    organization_id: organizationId,
    name: branch.name,
    last_commit_sha: branch.commit.sha,
    protected: Boolean(branch.protected),
  }
}

// Tudo o que a chave consegue ler (até 100). Atenção: inclui TODOS os repositórios
// públicos, não só os escolhidos ao criar a chave; por isso o admin seleciona (G2)
export function listRepositories(token, fetchImpl = fetch) {
  return githubGet(token, `/user/repos?${PAGE}&sort=pushed`, fetchImpl)
}

// O que a tela de seleção mostra de cada repositório
export function toAvailableRepository(repo, selectedIds) {
  return {
    githubId: repo.id,
    fullName: repo.full_name,
    description: repo.description ?? null,
    private: Boolean(repo.private),
    selected: selectedIds.has(repo.id),
  }
}

// Confere a chave antes de guardar: quem é o dono e quantos repositórios ela libera
export async function checkToken(token, fetchImpl = fetch) {
  const user = await githubGet(token, '/user', fetchImpl)
  const repos = await listRepositories(token, fetchImpl)

  return { login: user.login, repositoryCount: repos.length }
}

const COMMIT_PAGES = 3

// Commits da branch padrão desde `since` (até 300). Repositório vazio responde 409.
async function fetchCommits(token, repo, since, fetchImpl) {
  const commits = []

  for (let page = 1; page <= COMMIT_PAGES; page += 1) {
    const path = `/repos/${repo.full_name}/commits?sha=${encodeURIComponent(repo.default_branch)}&since=${since}&${PAGE}&page=${page}`
    let batch

    try {
      batch = await githubGet(token, path, fetchImpl)
    } catch (error) {
      if (error instanceof GitHubError && error.status === 409) return []
      throw error
    }

    commits.push(...batch)
    if (batch.length < 100) break
  }

  return commits
}

// PRs (os 100 mais recentes, com aprovações), branches (até 100) e commits da
// branch padrão desde `since`, de cada repositório escolhido
export function fetchRepositoryData(token, repos, fetchImpl = fetch, since) {
  return Promise.all(
    repos.map(async (repo) => {
      const [owner, name] = repo.full_name.split('/')
      const [pullData, branches, commits] = await Promise.all([
        githubGraphql(token, pullRequestsQuery, { owner, name }, fetchImpl),
        githubGet(token, `/repos/${repo.full_name}/branches?${PAGE}`, fetchImpl),
        fetchCommits(token, repo, since, fetchImpl),
      ])

      return { repo, pulls: pullData.repository.pullRequests.nodes, branches, commits }
    }),
  )
}
