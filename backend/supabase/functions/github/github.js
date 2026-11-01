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

export async function githubGet(token, path, fetchImpl = fetch) {
  let response

  try {
    response = await fetchImpl(`${API}${path}`, {
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

export function toRepositoryRow(repo, { projectId, organizationId }) {
  return {
    project_id: projectId,
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

// O GitHub diz "closed" também para PR mergeado; aqui os dois se separam
export function pullRequestState(pr) {
  if (pr.merged_at) return 'merged'
  return pr.state === 'open' ? 'open' : 'closed'
}

export function toPullRequestRow(pr, { repositoryId, organizationId }) {
  return {
    repository_id: repositoryId,
    organization_id: organizationId,
    number: pr.number,
    title: pr.title,
    state: pullRequestState(pr),
    draft: Boolean(pr.draft),
    author_login: pr.user?.login ?? null,
    html_url: pr.html_url,
    created_at_github: pr.created_at,
    updated_at_github: pr.updated_at,
    merged_at: pr.merged_at ?? null,
    closed_at: pr.closed_at ?? null,
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

// Confere a chave antes de guardar: quem é o dono e quantos repositórios ela libera
export async function checkToken(token, fetchImpl = fetch) {
  const user = await githubGet(token, '/user', fetchImpl)
  const repos = await githubGet(token, `/user/repos?${PAGE}&sort=pushed`, fetchImpl)

  return { login: user.login, repositoryCount: repos.length }
}

// Busca tudo o que a sincronização grava: até 100 repositórios, e até 100 PRs
// (os mais recentes) e 100 branches de cada um
export async function fetchProjectData(token, fetchImpl = fetch) {
  const repos = await githubGet(token, `/user/repos?${PAGE}&sort=pushed`, fetchImpl)

  return Promise.all(
    repos.map(async (repo) => {
      const [pulls, branches] = await Promise.all([
        githubGet(
          token,
          `/repos/${repo.full_name}/pulls?state=all&sort=updated&direction=desc&${PAGE}`,
          fetchImpl,
        ),
        githubGet(token, `/repos/${repo.full_name}/branches?${PAGE}`, fetchImpl),
      ])

      return { repo, pulls, branches }
    }),
  )
}
