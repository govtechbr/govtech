// Rodar com: node --test backend/supabase/functions/github/
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  checkToken,
  fetchProjectData,
  GitHubError,
  githubErrorMessage,
  pullRequestState,
  toBranchRow,
  toPullRequestRow,
  toRepositoryRow,
} from './github.js'

const ids = { projectId: 'p1', organizationId: 'o1', repositoryId: 'r1' }

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

const pr = {
  number: 7,
  title: 'Adiciona login',
  state: 'closed',
  draft: false,
  user: { login: 'ana' },
  html_url: 'https://github.com/dono/app/pull/7',
  created_at: '2026-10-30T10:00:00Z',
  updated_at: '2026-10-31T10:00:00Z',
  merged_at: '2026-10-31T10:00:00Z',
  closed_at: '2026-10-31T10:00:00Z',
}

describe('row mapping', () => {
  it('maps a repository with the project and organization', () => {
    const row = toRepositoryRow(repo, ids)

    assert.equal(row.project_id, 'p1')
    assert.equal(row.organization_id, 'o1')
    assert.equal(row.github_id, 42)
    assert.equal(row.full_name, 'dono/app')
    assert.equal(row.private, true)
  })

  it('tells merged PRs apart from closed ones', () => {
    assert.equal(pullRequestState(pr), 'merged')
    assert.equal(pullRequestState({ ...pr, merged_at: null }), 'closed')
    assert.equal(pullRequestState({ ...pr, state: 'open', merged_at: null }), 'open')
  })

  it('maps a pull request, tolerating a deleted author', () => {
    assert.equal(toPullRequestRow(pr, ids).author_login, 'ana')
    assert.equal(toPullRequestRow({ ...pr, user: null }, ids).author_login, null)
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

  it('fetches pulls and branches of every repository', async () => {
    const { impl } = fakeFetch({
      '/user/repos': [200, [repo]],
      '/repos/dono/app/pulls': [200, [pr]],
      '/repos/dono/app/branches': [200, [{ name: 'main', commit: { sha: 'abc' } }]],
    })

    const [data] = await fetchProjectData('t', impl)

    assert.equal(data.repo.full_name, 'dono/app')
    assert.equal(data.pulls.length, 1)
    assert.equal(data.branches[0].name, 'main')
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
