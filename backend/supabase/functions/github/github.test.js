// Rodar com: node --test "backend/supabase/functions/*/*.test.js"
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  checkToken,
  ciState,
  toCiRunRow,
  fetchPullRequests,
  fetchRepositoryData,
  GitHubError,
  githubErrorMessage,
  pullRequestState,
  toBranchRow,
  toCommitRow,
  toPullRequestRow,
  toAvailableRepository,
  toRepositoryRow,
  listRepositories,
  LIMITS,
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
    // a resposta pode depender do pedido (página, cursor do GraphQL)
    const reply = typeof route[1] === 'function' ? route[1](path, options) : route[1]
    const [status, body, headers = {}] = reply

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
  author: {
    login: 'ana',
    avatarUrl: 'https://avatars.githubusercontent.com/u/1',
  },
  reviews: { totalCount: 2 },
  commits: { nodes: [{ commit: { statusCheckRollup: { state: 'FAILURE' } } }] },
}

const commit = {
  sha: 'abc123',
  author: {
    login: 'ana',
    avatar_url: 'https://avatars.githubusercontent.com/u/1',
  },
  commit: {
    author: {
      name: 'Ana Silva',
      email: 'ana@empresa.com',
      date: '2026-10-30T09:00:00Z',
    },
    committer: {
      name: 'GitHub',
      email: 'noreply@github.com',
      date: '2026-10-30T10:00:00Z',
    },
    message: 'feat: login',
  },
}

// GraphQL paginado: `open` e `done` são listas de páginas de PRs (abertos e
// mergeados/fechados); o cursor é o número da próxima página. `mainCi` é o
// estado do CI da branch principal (null = repositório vazio)
function graphqlPages({ open = [[]], done = [[]], mainCi = 'SUCCESS' } = {}) {
  return (_path, options) => {
    const { query, variables } = JSON.parse(options.body)
    if (query.includes('defaultBranchRef')) {
      const target = mainCi && { statusCheckRollup: { state: mainCi } }
      return [200, { data: { repository: { defaultBranchRef: target && { target } } } }]
    }

    const { states, after } = variables
    const pages = states.includes('OPEN') ? open : done
    const index = after ? Number(after) : 0

    return [
      200,
      {
        data: {
          repository: {
            pullRequests: {
              nodes: pages[index] ?? [],
              pageInfo: {
                hasNextPage: index < pages.length - 1,
                endCursor: String(index + 1),
              },
            },
          },
        },
      },
    ]
  }
}

// Página REST: `pages` são listas; a página pedida vem do parâmetro page
function restPagesOf(pages) {
  return (path) => [
    200,
    pages[Number(new URL(path, 'https://x').searchParams.get('page')) - 1] ?? [],
  ]
}

const pullsResponse = graphqlPages({ done: [[pr]] })

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
        {
          githubId: 42,
          fullName: 'dono/app',
          description: null,
          private: true,
          selected: true,
        },
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

describe('CI status (rule G10)', () => {
  it('maps the combined check state to green, failed or running', () => {
    assert.equal(ciState({ state: 'SUCCESS' }), 'success')
    assert.equal(ciState({ state: 'FAILURE' }), 'failure')
    assert.equal(ciState({ state: 'ERROR' }), 'failure')
    assert.equal(ciState({ state: 'PENDING' }), 'pending')
    assert.equal(ciState({ state: 'EXPECTED' }), 'pending')
    // repositório sem CI
    assert.equal(ciState(null), null)
    assert.equal(ciState(undefined), null)
  })

  it('stores the CI state of the last commit of each PR', () => {
    assert.equal(toPullRequestRow(pr, ids).ci_state, 'failure')
    assert.equal(toPullRequestRow({ ...pr, commits: { nodes: [] } }, ids).ci_state, null)
  })

  it('fetches the CI state of the default branch', async () => {
    const { impl } = fakeFetch({
      '/graphql': graphqlPages({ mainCi: 'FAILURE' }),
      '/repos/dono/app/branches': [200, []],
      '/repos/dono/app/commits': [200, []],
      '/repos/dono/app/actions/runs': [200, { total_count: 0, workflow_runs: [] }],
    })

    const [data] = await fetchRepositoryData('t', [repo], impl, 'x')

    assert.equal(data.mainCiState, 'failure')
  })

  it('treats an empty repository as having no CI', async () => {
    const { impl } = fakeFetch({
      '/graphql': graphqlPages({ mainCi: null }),
      '/repos/dono/app/branches': [200, []],
      '/repos/dono/app/commits': [200, []],
      '/repos/dono/app/actions/runs': [200, { total_count: 0, workflow_runs: [] }],
    })

    const [data] = await fetchRepositoryData('t', [repo], impl, 'x')

    assert.equal(data.mainCiState, null)
  })

  // Chave sem permissão de Commit statuses/Actions: o GitHub devolve os dados com
  // erro só no campo do CI. A sincronização segue, com o CI "sem CI"
  it('keeps syncing when the token cannot read the CI', async () => {
    const forbidden = {
      type: 'FORBIDDEN',
      message: 'Resource not accessible by personal access token',
    }
    const { impl } = fakeFetch({
      '/graphql': (path, options) => {
        const [status, body] = graphqlPages({
          done: [
            [
              {
                ...pr,
                commits: { nodes: [{ commit: { statusCheckRollup: null } }] },
              },
            ],
          ],
          mainCi: null,
        })(path, options)
        const isMain = JSON.parse(options.body).query.includes('defaultBranchRef')
        const field = isMain
          ? ['repository', 'defaultBranchRef', 'target', 'statusCheckRollup']
          : [
              'repository',
              'pullRequests',
              'nodes',
              0,
              'commits',
              'nodes',
              0,
              'commit',
              'statusCheckRollup',
            ]
        return [status, { ...body, errors: [{ ...forbidden, path: field }] }]
      },
      '/repos/dono/app/branches': [200, []],
      '/repos/dono/app/commits': [200, []],
      '/repos/dono/app/actions/runs': [200, { total_count: 0, workflow_runs: [] }],
    })

    const [data] = await fetchRepositoryData('t', [repo], impl, '2026-08-01T00:00:00.000Z')

    assert.equal(data.mainCiState, null)
    assert.equal(toPullRequestRow(data.pulls[0], ids).ci_state, null)
  })
})

// Execução do GitHub Actions como vem de GET /repos/{dono}/{repo}/actions/runs
function run(overrides = {}) {
  return {
    id: 9060,
    run_number: 60,
    name: 'CI',
    event: 'pull_request',
    head_branch: 'fix/x',
    head_sha: 'abc',
    status: 'completed',
    conclusion: 'failure',
    html_url: 'https://github.com/dono/app/actions/runs/9060',
    created_at: '2026-11-02T06:32:33Z',
    run_started_at: '2026-11-02T06:32:35Z',
    updated_at: '2026-11-02T06:33:40Z',
    actor: { login: 'ana' },
    triggering_actor: { login: 'ana' },
    ...overrides,
  }
}

describe('CI run history (rule G11)', () => {
  it('maps a finished run without who triggered it', () => {
    const row = toCiRunRow(run(), ids)

    assert.deepEqual(row, {
      repository_id: 'r1',
      organization_id: 'o1',
      github_run_id: 9060,
      run_number: 60,
      workflow_name: 'CI',
      event: 'pull_request',
      head_branch: 'fix/x',
      head_sha: 'abc',
      status: 'completed',
      conclusion: 'failure',
      html_url: 'https://github.com/dono/app/actions/runs/9060',
      started_at: '2026-11-02T06:32:35Z',
      completed_at: '2026-11-02T06:33:40Z',
    })
    assert.equal(JSON.stringify(row).includes('ana'), false)
  })

  it('leaves a running run without end time', () => {
    const row = toCiRunRow(
      run({ status: 'in_progress', conclusion: null, run_started_at: null }),
      ids,
    )

    assert.equal(row.completed_at, null)
    assert.equal(row.conclusion, null)
    assert.equal(row.started_at, '2026-11-02T06:32:33Z')
  })

  it('fetches the runs created in the window, page by page', async () => {
    const full = Array.from({ length: 100 }, (_, index) => run({ id: index, run_number: index }))
    const { impl, calls } = fakeFetch({
      '/graphql': graphqlPages(),
      '/repos/dono/app/branches': [200, []],
      '/repos/dono/app/commits': [200, []],
      '/repos/dono/app/actions/runs': (path) => {
        const page = Number(new URL(path, 'https://x').searchParams.get('page'))
        return [200, { total_count: 101, workflow_runs: page === 1 ? full : [run({ id: 500 })] }]
      },
    })

    const [data] = await fetchRepositoryData('t', [repo], impl, '2026-08-04T12:00:00.000Z')

    const runCalls = calls.filter(({ url }) => url.includes('/actions/runs'))
    assert.equal(runCalls.length, 2)
    assert.match(decodeURIComponent(runCalls[0].url), /created=>=2026-08-04/)
    assert.match(runCalls[1].url, /per_page=100&page=2/)
    assert.equal(data.ciRuns.length, 101)
    assert.equal(data.partial, false)
  })

  it('marks partial data when the run cap is reached', async () => {
    const full = Array.from({ length: 100 }, (_, index) => run({ id: index }))
    const { impl } = fakeFetch({
      '/graphql': graphqlPages(),
      '/repos/dono/app/branches': [200, []],
      '/repos/dono/app/commits': [200, []],
      '/repos/dono/app/actions/runs': [200, { total_count: 5000, workflow_runs: full }],
    })

    const [data] = await fetchRepositoryData('t', [repo], impl, '2026-08-04T12:00:00.000Z')

    assert.equal(data.ciRuns.length, LIMITS.ciRuns)
    assert.equal(data.partial, true)
  })

  // Chave sem a permissão Actions: o histórico fica vazio e a sincronização segue
  it('keeps syncing when the token cannot read Actions', async () => {
    const { impl } = fakeFetch({
      '/graphql': graphqlPages(),
      '/repos/dono/app/branches': [200, []],
      '/repos/dono/app/commits': [200, []],
      '/repos/dono/app/actions/runs': [403, { message: 'Resource not accessible' }],
    })

    const [data] = await fetchRepositoryData('t', [repo], impl, '2026-08-04T12:00:00.000Z')

    assert.deepEqual(data.ciRuns, [])
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
      '/graphql': pullsResponse,
      '/repos/dono/app/branches': [200, [{ name: 'main', commit: { sha: 'abc' } }]],
      '/repos/dono/app/commits': [200, [commit]],
      '/repos/dono/app/actions/runs': [200, { total_count: 0, workflow_runs: [] }],
    })

    const [data] = await fetchRepositoryData('t', [repo], impl, '2026-08-01T00:00:00.000Z')

    // abertos, depois mergeados/fechados; uma página de branches e uma de commits
    // mais uma chamada GraphQL para o CI da branch principal (regra G10)
    const graphql = calls.filter(({ url }) => url.endsWith('/graphql'))
    assert.equal(graphql.length, 3)
    assert.deepEqual(
      graphql
        .map(({ options }) => JSON.parse(options.body).variables)
        .filter((variables) => variables.states),
      [
        { owner: 'dono', name: 'app', states: ['OPEN'], after: null },
        {
          owner: 'dono',
          name: 'app',
          states: ['MERGED', 'CLOSED'],
          after: null,
        },
      ],
    )
    const commits = calls.find(({ url }) => url.includes('/commits'))
    assert.match(commits.url, /sha=main/)
    assert.match(commits.url, /since=2026-08-01T00:00:00.000Z/)
    assert.match(commits.url, /per_page=100&page=1/)

    assert.equal(data.repo.full_name, 'dono/app')
    assert.equal(data.pulls[0].number, 7)
    assert.equal(data.branches[0].name, 'main')
    assert.equal(data.commits[0].sha, 'abc123')
    assert.equal(data.partial, false)
  })

  it('treats an empty repository as having no commits', async () => {
    const { impl } = fakeFetch({
      '/graphql': graphqlPages(),
      '/repos/dono/app/branches': [200, []],
      '/repos/dono/app/commits': [409, { message: 'Git Repository is empty.' }],
      '/repos/dono/app/actions/runs': [200, { total_count: 0, workflow_runs: [] }],
    })

    const [data] = await fetchRepositoryData('t', [repo], impl, '2026-08-01T00:00:00.000Z')

    assert.deepEqual(data.commits, [])
  })

  it('reports a GraphQL error as a GitHub error', async () => {
    const { impl } = fakeFetch({
      '/graphql': [200, { errors: [{ type: 'FORBIDDEN', message: 'Resource not accessible' }] }],
      '/repos/dono/app/branches': [200, []],
      '/repos/dono/app/commits': [200, []],
      '/repos/dono/app/actions/runs': [200, { total_count: 0, workflow_runs: [] }],
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

describe('pagination (rule G9)', () => {
  const since = '2026-08-01T00:00:00.000Z'
  const pull = (number, updatedAt = '2026-10-31T10:00:00Z') => ({
    ...pr,
    number,
    updatedAt,
  })
  const fullPage = (start, updatedAt) =>
    Array.from({ length: 100 }, (_, index) => pull(start + index, updatedAt))

  it('follows the GraphQL cursor through every page of open PRs', async () => {
    const { impl, calls } = fakeFetch({
      '/graphql': graphqlPages({
        open: [fullPage(1), [pull(101)]],
        done: [[pull(500)]],
      }),
    })

    const { pulls, partial } = await fetchPullRequests('t', repo, since, impl)

    assert.equal(pulls.length, 102)
    assert.equal(partial, false)
    const afters = calls.map(({ options }) => JSON.parse(options.body).variables.after)
    assert.deepEqual(afters, [null, '1', null])
  })

  it('stops reading merged and closed PRs once they are older than the 90-day window', async () => {
    const old = '2026-07-01T00:00:00Z'
    const { impl, calls } = fakeFetch({
      '/graphql': graphqlPages({
        done: [fullPage(1), [pull(101), pull(102, old)], fullPage(200)],
      }),
    })

    const { pulls, partial } = await fetchPullRequests('t', repo, since, impl)

    assert.equal(pulls.length, 101)
    assert.ok(pulls.every((item) => item.updatedAt >= since))
    assert.equal(partial, false)
    // a terceira página nem é pedida: 1 de abertos + 2 de fechados
    assert.equal(calls.length, 3)
  })

  it('marks partial data when the PR ceiling is reached with more to come', async () => {
    const pages = Array.from({ length: 12 }, (_, page) => fullPage(page * 100))
    const { impl } = fakeFetch({ '/graphql': graphqlPages({ open: pages }) })

    const { pulls, partial } = await fetchPullRequests('t', repo, since, impl)

    assert.equal(pulls.length, LIMITS.pullRequests)
    assert.equal(partial, true)
  })

  it('reads branches and commits page by page and flags a full last page at the ceiling', async () => {
    const branchPage = (count) =>
      Array.from({ length: count }, (_, index) => ({
        name: `b${index}`,
        commit: { sha: 's' },
      }))
    const commitPage = Array.from({ length: 100 }, (_, index) => ({
      ...commit,
      sha: `c${index}`,
    }))
    const { impl, calls } = fakeFetch({
      '/graphql': graphqlPages(),
      '/repos/dono/app/branches': restPagesOf([branchPage(100), branchPage(30)]),
      '/repos/dono/app/commits': [200, commitPage],
      '/repos/dono/app/actions/runs': [200, { total_count: 0, workflow_runs: [] }],
    })

    const [data] = await fetchRepositoryData('t', [repo], impl, since)

    assert.equal(data.branches.length, 130)
    assert.equal(calls.filter(({ url }) => url.includes('/branches')).length, 2)
    assert.equal(data.commits.length, LIMITS.commits)
    assert.equal(calls.filter(({ url }) => url.includes('/commits')).length, 10)
    assert.equal(data.partial, true)
  })

  it('lists up to 500 repositories the token can read, most recently pushed first', async () => {
    const page = (start, count) =>
      Array.from({ length: count }, (_, index) => ({
        ...repo,
        id: start + index,
      }))
    const { impl, calls } = fakeFetch({
      '/user/repos': restPagesOf([page(0, 100), page(100, 100), page(200, 5)]),
    })

    const repos = await listRepositories('t', impl)

    assert.equal(repos.length, 205)
    assert.ok(calls[0].url.endsWith('/user/repos?sort=pushed&per_page=100&page=1'))
    assert.equal(calls.length, 3)
  })
})
