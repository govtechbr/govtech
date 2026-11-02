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

// Erro só no campo do CI (chave sem permissão de Commit statuses/Actions): o
// resto dos dados vale e o CI fica "sem CI" (regra G10)
function isCiFieldError({ path }) {
  return Array.isArray(path) && path.includes('statusCheckRollup')
}

// A API GraphQL responde 200 mesmo com erro; o erro vem no corpo
export async function githubGraphql(token, query, variables, fetchImpl = fetch) {
  const body = await githubGet(token, '/graphql', fetchImpl, {
    method: 'POST',
    body: JSON.stringify({ query, variables }),
  })

  if (body.errors?.length && !(body.data && body.errors.every(isCiFieldError))) {
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

// Tetos da paginação (regra G9). Bateu um teto: a sincronização marca "dados parciais"
export const LIMITS = {
  repositories: 500,
  pullRequests: 1000,
  branches: 500,
  commits: 1000,
}

// PRs com as aprovações (regra G7), 100 por página, do mais recém-atualizado ao mais antigo
const pullRequestsQuery = `
  query ($owner: String!, $name: String!, $states: [PullRequestState!], $after: String) {
    repository(owner: $owner, name: $name) {
      pullRequests(
        first: 100
        after: $after
        states: $states
        orderBy: { field: UPDATED_AT, direction: DESC }
      ) {
        pageInfo { hasNextPage endCursor }
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
          commits(last: 1) { nodes { commit { statusCheckRollup { state } } } }
        }
      }
    }
  }
`

// Páginas de PRs até acabar, chegar ao teto ou (com `since`) passar da janela.
// partial = parou no teto com mais PRs por vir
async function fetchPullRequestPages(token, repo, states, since, fetchImpl) {
  const [owner, name] = repo.full_name.split('/')
  const pulls = []
  let after = null

  while (pulls.length < LIMITS.pullRequests) {
    const data = await githubGraphql(
      token,
      pullRequestsQuery,
      { owner, name, states, after },
      fetchImpl,
    )
    const { nodes, pageInfo } = data.repository.pullRequests
    const inWindow = since ? nodes.filter((pr) => pr.updatedAt >= since) : nodes

    pulls.push(...inWindow)
    if (!pageInfo.hasNextPage || inWindow.length < nodes.length) {
      return { pulls, partial: false }
    }
    after = pageInfo.endCursor
  }

  return { pulls: pulls.slice(0, LIMITS.pullRequests), partial: true }
}

// Todos os abertos (podem estar parados há meses e ainda gerar alerta) e os
// mergeados ou fechados atualizados desde `since` (regra G9)
export async function fetchPullRequests(token, repo, since, fetchImpl = fetch) {
  const open = await fetchPullRequestPages(token, repo, ['OPEN'], null, fetchImpl)
  const done = await fetchPullRequestPages(token, repo, ['MERGED', 'CLOSED'], since, fetchImpl)

  return { pulls: [...open.pulls, ...done.pulls], partial: open.partial || done.partial }
}

// Resultado combinado dos checks do commit (regra G10). null = sem CI
const CI_STATES = {
  SUCCESS: 'success',
  FAILURE: 'failure',
  ERROR: 'failure',
  PENDING: 'pending',
  EXPECTED: 'pending',
}

export function ciState(rollup) {
  return CI_STATES[rollup?.state] ?? null
}

const mainCiQuery = `
  query ($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      defaultBranchRef { target { ... on Commit { statusCheckRollup { state } } } }
    }
  }
`

// CI do último commit da branch padrão; repositório vazio não tem branch
async function fetchMainCiState(token, repo, fetchImpl) {
  const [owner, name] = repo.full_name.split('/')
  const data = await githubGraphql(token, mainCiQuery, { owner, name }, fetchImpl)

  return ciState(data.repository?.defaultBranchRef?.target?.statusCheckRollup)
}

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
    ci_state: ciState(pr.commits?.nodes?.[0]?.commit?.statusCheckRollup),
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

// Páginas de 100 de uma lista da API REST, até acabar ou chegar ao teto.
// partial = a última página veio cheia no teto (pode haver mais)
export async function restPages(token, path, max, fetchImpl = fetch) {
  const items = []
  const separator = path.includes('?') ? '&' : '?'

  for (let page = 1; page <= max / 100; page += 1) {
    const batch = await githubGet(token, `${path}${separator}${PAGE}&page=${page}`, fetchImpl)

    items.push(...batch)
    if (batch.length < 100) return { items, partial: false }
  }

  return { items, partial: true }
}

// Tudo o que a chave consegue ler (até 500, os com push mais recente). Atenção:
// inclui TODOS os repositórios públicos, não só os escolhidos ao criar a chave;
// por isso o admin seleciona (G2)
export async function listRepositories(token, fetchImpl = fetch) {
  const { items } = await restPages(
    token,
    '/user/repos?sort=pushed',
    LIMITS.repositories,
    fetchImpl,
  )

  return items
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

// Commits da branch padrão desde `since` (até 1.000). Repositório vazio responde 409.
async function fetchCommits(token, repo, since, fetchImpl) {
  const path = `/repos/${repo.full_name}/commits?sha=${encodeURIComponent(repo.default_branch)}&since=${since}`

  try {
    return await restPages(token, path, LIMITS.commits, fetchImpl)
  } catch (error) {
    if (error instanceof GitHubError && error.status === 409) return { items: [], partial: false }
    throw error
  }
}

// De cada repositório escolhido: PRs (abertos + 90 dias), branches, commits da
// branch padrão desde `since` e o CI dela, com partial = algum teto da regra G9
export function fetchRepositoryData(token, repos, fetchImpl = fetch, since) {
  return Promise.all(
    repos.map(async (repo) => {
      const [pullData, branchData, commitData, mainCiState] = await Promise.all([
        fetchPullRequests(token, repo, since, fetchImpl),
        restPages(token, `/repos/${repo.full_name}/branches`, LIMITS.branches, fetchImpl),
        fetchCommits(token, repo, since, fetchImpl),
        fetchMainCiState(token, repo, fetchImpl),
      ])

      return {
        repo,
        mainCiState,
        pulls: pullData.pulls,
        branches: branchData.items,
        commits: commitData.items,
        partial: pullData.partial || branchData.partial || commitData.partial,
      }
    }),
  )
}
