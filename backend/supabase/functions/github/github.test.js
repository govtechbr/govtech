// Rodar com: node --test "backend/supabase/functions/github/*.test.js"
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  checkToken,
  fetchRepositoryData,
  GitHubError,
  githubErrorMessage,
  pullRequestState,
  toBranchRow,
  toCommitRow,
  toPullRequestRow,
  toAvailableRepository,
  toRepositoryRow,
} from './github.js'

const ids = { organizationId: 'o1', repositoryId: 'r1' }

// fetch falso: responde pelo caminho pedido
function fakeFetch(routes) {
  const calls = []
  const impl = async (url, options) => {
    calls.push({ url, options })
    const path = url.replace('https://api.github.com', '')
    const route = Object.entries(routes).find(([prefix]) => path.startsWith(prefix))

    if (!route) throw new Error(`rota não simulada: ${path}`)
    const [status, body, headers = {}] = route[1]

    return {
      ok: status < 400,
      status,
      headers: { get: (name) => headers[name] ?? null },
      json: async () => body,
    }
  }

  return { impl, calls }
}

const repo = {
  id: 42,
  full_name: 'dono/app',
  name: 'app',
  description: null,
  language: 'JavaScript',
  default_branch: 'main',
  html_url: 'https://github.com/dono/app',
  private: true,
  pushed_at: '2026-11-01T10:00:00Z',
}

// PR como vem da API GraphQL (uma chamada traz os PRs e as aprovações)
const pr = {
  number: 7,
  title: 'Adiciona login',
  state: 'MERGED',
  isDraft: false,
  url: 'https://github.com/dono/app/pull/7',
  createdAt: '2026-10-30T10:00:00Z',
  updatedAt: '2026-10-31T10:00:00Z',
  mergedAt: '2026-10-31T10:00:00Z',
  closedAt: '2026-10-31T10:00:00Z',
  author: { login: 'ana', avatarUrl: 'https://avatars.githubusercontent.com/u/1' },
  reviews: { totalCount: 2 },
}

const commit = {
  sha: 'abc123',
  author: { login: 'ana', avatar_url: 'https://avatars.githubusercontent.com/u/1' },
  commit: {
    author: { name: 'Ana Silva', email: 'ana@empresa.com', date: '2026-10-30T09:00:00Z' },
    committer: { name: 'GitHub', email: 'noreply@github.com', date: '2026-10-30T10:00:00Z' },
    message: 'feat: login',
  },
}

const pullsResponse = { data: { repository: { pullRequests: { nodes: [pr] } } } }

describe('row mapping', () => {
  it('maps a repository to its organization (projects link to it separately)', () => {
    const row = toRepositoryRow(repo, ids)

    assert.equal(row.project_id, undefined)
    assert.equal(row.organization_id, 'o1')
    assert.equal(row.github_id, 42)
    assert.equal(row.full_name, 'dono/app')
    assert.equal(row.private, true)
  })

  it('marks which available repositories are already selected', () => {
    const other = { ...repo, id: 99, full_name: 'dono/outro', private: false }

    assert.deepEqual(
      [repo, other].map((item) => toAvailableRepository(item, new Set([42]))),
      [
        { githubId: 42, fullName: 'dono/app', description: null, private: true, selected: true },
        {
          githubId: 99,
          fullName: 'dono/outro',
          description: null,
          private: false,
          selected: false,
        },
      ],
    )
  })

  it('maps the GitHub PR states to ours', () => {
    assert.equal(pullRequestState(pr), 'merged')
    assert.equal(pullRequestState({ ...pr, state: 'CLOSED' }), 'closed')
    assert.equal(pullRequestState({ ...pr, state: 'OPEN' }), 'open')
  })

  it('maps a pull request with its approvals, tolerating a deleted author', () => {
    const row = toPullRequestRow(pr, ids)

    assert.equal(row.author_login, 'ana')
    assert.equal(row.author_avatar_url, 'https://avatars.githubusercontent.com/u/1')
    assert.equal(row.approval_count, 2)
    assert.equal(row.merged_at, '2026-10-31T10:00:00Z')
    assert.equal(toPullRequestRow({ ...pr, author: null }, ids).author_login, null)
  })

  it('keeps only the login and avatar of a commit author (LGPD)', () => {
    assert.deepEqual(toCommitRow(commit, ids), {
      repository_id: 'r1',
      organization_id: 'o1',
      sha: 'abc123',
      author_login: 'ana',
      author_avatar_url: 'https://avatars.githubusercontent.com/u/1',
      committed_at: '2026-10-30T10:00:00Z',
    })
    // e-mail sem conta no GitHub: fica sem autor, nunca com o e-mail
    assert.equal(toCommitRow({ ...commit, author: null }, ids).author_login, null)
  })

  it('maps a branch with its last commit', () => {
    const row = toBranchRow({ name: 'main', commit: { sha: 'abc' }, protected: true }, ids)

    assert.deepEqual(row, {
      repository_id: 'r1',
      organization_id: 'o1',
      name: 'main',
      last_commit_sha: 'abc',
      protected: true,
    })
  })
})

describe('GitHub calls', () => {
  it('checks a token and counts the repositories it can read', async () => {
    const { impl, calls } = fakeFetch({
      '/user/repos': [200, [repo]],
      '/user': [200, { login: 'dono' }],
    })

    assert.deepEqual(await checkToken('t0k3n', impl), {
      login: 'dono',
      repositoryCount: 1,
    })
    assert.equal(calls[0].options.headers.Authorization, 'Bearer t0k3n')
  })

  it('fetches pulls, branches and recent default-branch commits of the chosen repositories', async () => {
    const { impl, calls } = fakeFetch({
      '/graphql': [200, pullsResponse],
      '/repos/dono/app/branches': [200, [{ name: 'main', commit: { sha: 'abc' } }]],
      '/repos/dono/app/commits': [200, [commit]],
    })

    const [data] = await fetchRepositoryData('t', [repo], impl, '2026-08-01T00:00:00.000Z')

    assert.equal(calls.length, 3)
    const graphql = calls.find(({ url }) => url.endsWith('/graphql'))
    assert.deepEqual(JSON.parse(graphql.options.body).variables, { owner: 'dono', name: 'app' })
    const commits = calls.find(({ url }) => url.includes('/commits'))
    assert.match(commits.url, /sha=main/)
    assert.match(commits.url, /since=2026-08-01T00:00:00.000Z/)

    assert.equal(data.repo.full_name, 'dono/app')
    assert.equal(data.pulls[0].number, 7)
    assert.equal(data.branches[0].name, 'main')
    assert.equal(data.commits[0].sha, 'abc123')
  })

  it('reads up to 3 pages of commits', async () => {
    const page = Array.from({ length: 100 }, (_, index) => ({ ...commit, sha: `c${index}` }))
    const { impl, calls } = fakeFetch({
      '/graphql': [200, pullsResponse],
      '/repos/dono/app/branches': [200, []],
      '/repos/dono/app/commits': [200, page],
    })

    const [data] = await fetchRepositoryData('t', [repo], impl, '2026-08-01T00:00:00.000Z')

    assert.equal(calls.filter(({ url }) => url.includes('/commits')).length, 3)
    assert.equal(data.commits.length, 300)
  })

  it('treats an empty repository as having no commits', async () => {
    const { impl } = fakeFetch({
      '/graphql': [200, { data: { repository: { pullRequests: { nodes: [] } } } }],
      '/repos/dono/app/branches': [200, []],
      '/repos/dono/app/commits': [409, { message: 'Git Repository is empty.' }],
    })

    const [data] = await fetchRepositoryData('t', [repo], impl, '2026-08-01T00:00:00.000Z')

    assert.deepEqual(data.commits, [])
  })

  it('reports a GraphQL error as a GitHub error', async () => {
    const { impl } = fakeFetch({
      '/graphql': [200, { errors: [{ type: 'FORBIDDEN', message: 'Resource not accessible' }] }],
      '/repos/dono/app/branches': [200, []],
      '/repos/dono/app/commits': [200, []],
    })

    await assert.rejects(fetchRepositoryData('t', [repo], impl, 'x'), (error) => {
      assert.ok(error instanceof GitHubError)
      assert.match(error.message, /permissão/)
      return true
    })
  })

  it('explains an invalid token in Portuguese', async () => {
    const { impl } = fakeFetch({ '/user': [401, {}] })

    await assert.rejects(checkToken('ruim', impl), (error) => {
      assert.ok(error instanceof GitHubError)
      assert.equal(error.status, 401)
      assert.match(error.message, /inválida ou expirada/)
      return true
    })
  })

  it('distinguishes the rate limit from a missing permission', () => {
    assert.match(githubErrorMessage(403, '0'), /Limite de chamadas/)
    assert.match(githubErrorMessage(403, '4999'), /permissão/)
    assert.match(githubErrorMessage(500), /não respondeu/)
  })

  it('reports GitHub as unreachable when the network fails', async () => {
    const failing = async () => {
      throw new Error('offline')
    }

    await assert.rejects(checkToken('t', failing), /não respondeu/)
  })
})
