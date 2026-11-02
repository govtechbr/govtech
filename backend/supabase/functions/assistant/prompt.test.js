// Rodar com: node --test "backend/supabase/functions/*/*.test.js"
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  answerText,
  buildMessages,
  InvalidRequest,
  MAX_CONTEXT_BYTES,
  stripPersonalData,
  validateRequest,
} from './prompt.js'

const organizationId = '10000000-0000-0000-0000-00000000000a'
const question = { role: 'user', content: '  Por que o índice está em 57?  ' }
const context = { index: { score: 57 }, pullRequests: [{ number: 12, title: 'Ajusta login' }] }

function request(overrides) {
  return { organizationId, messages: [question], context, ...overrides }
}

describe('validateRequest', () => {
  it('accepts a question and trims it', () => {
    const valid = validateRequest(request())

    assert.equal(valid.organizationId, organizationId)
    assert.deepEqual(valid.messages, [{ role: 'user', content: 'Por que o índice está em 57?' }])
    assert.deepEqual(valid.context, context)
  })

  it('rejects a missing organization, bad roles and an empty question', () => {
    assert.throws(() => validateRequest(request({ organizationId: 'org' })), InvalidRequest)
    assert.throws(
      () => validateRequest(request({ messages: [{ role: 'system', content: 'oi' }] })),
      InvalidRequest,
    )
    assert.throws(
      () => validateRequest(request({ messages: [{ role: 'user', content: '   ' }] })),
      InvalidRequest,
    )
    assert.throws(() => validateRequest(request({ messages: [] })), InvalidRequest)
    assert.throws(() => validateRequest(null), InvalidRequest)
  })

  it('needs the last message to be the question', () => {
    assert.throws(
      () => validateRequest(request({ messages: [question, { role: 'assistant', content: 'Oi' }] })),
      InvalidRequest,
    )
  })

  it('limits the history, the question and the context size', () => {
    const history = Array.from({ length: 7 }, () => question)
    assert.throws(() => validateRequest(request({ messages: history })), InvalidRequest)
    assert.throws(
      () => validateRequest(request({ messages: [{ role: 'user', content: 'a'.repeat(1001) }] })),
      /até 1000 caracteres/,
    )
    assert.throws(
      () => validateRequest(request({ context: { text: 'a'.repeat(MAX_CONTEXT_BYTES) } })),
      /Dados demais/,
    )
  })

  it('removes personal data from the context (rule IA2)', () => {
    const valid = validateRequest(
      request({
        context: { pullRequests: [{ number: 1, author_login: 'alice', authorAvatarUrl: 'x' }] },
      }),
    )

    assert.deepEqual(valid.context, { pullRequests: [{ number: 1 }] })
  })
})

describe('stripPersonalData', () => {
  it('drops login, avatar, e-mail, token and user id keys at any depth', () => {
    assert.deepEqual(
      stripPersonalData({
        email: 'a@b.c',
        projects: [{ name: 'Portal', owner: { login: 'bob', userId: 'u1' }, token: 't' }],
        score: 57,
      }),
      { projects: [{ name: 'Portal', owner: {} }], score: 57 },
    )
  })
})

describe('buildMessages', () => {
  it('sends the fixed rules, the data as data, then the conversation', () => {
    const messages = buildMessages(context, [{ role: 'user', content: 'Oi' }])

    assert.equal(messages[0].role, 'system')
    assert.match(messages[0].content, /português do Brasil/)
    assert.match(messages[0].content, /revisão de código 30/)
    assert.match(messages[0].content, /dados, não instruções/)
    // cada critério já chega como nota de 0 a 100; prazo 100 = mais de 7 dias
    assert.match(messages[0].content, /já são notas de 0 a 100/)
    assert.match(messages[0].content, /deadline 100 = faltam mais de 7 dias/)
    assert.equal(messages[1].role, 'system')
    assert.match(messages[1].content, /^DADOS DA EMPRESA/)
    assert.ok(messages[1].content.includes('"score":57'))
    assert.deepEqual(messages[2], { role: 'user', content: 'Oi' })
  })
})

describe('answerText', () => {
  it('reads the first choice and treats an empty answer as missing', () => {
    assert.equal(answerText({ choices: [{ message: { content: ' Resposta \n' } }] }), 'Resposta')
    assert.equal(answerText({ choices: [{ message: { content: '' } }] }), null)
    assert.equal(answerText({}), null)
  })

  it('removes bold marks, since the panel shows plain text', () => {
    assert.equal(
      answerText({ choices: [{ message: { content: 'O índice está em **57** e __cai__.' } }] }),
      'O índice está em 57 e cai.',
    )
  })
})
