import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { appearanceBoot } from '../lib/appearance'
import { userFacingError } from '../lib/user-errors'

test('unexpected server/provider errors never become interface text', () => {
  const internal = 'PrismaClientKnownRequestError SQLSTATE 23505\n at secret-file.ts:9'
  for (const status of [400, 409, 500, 502]) {
    assert(!userFacingError(status, { error: internal }).includes('Prisma'))
    assert(!userFacingError(status, { error: internal, code: 'BIMO_REQUEST_ERROR' }).includes('SQLSTATE'))
  }
  assert.equal(userFacingError(400, { code: 'BIMO_REQUEST_ERROR', error: 'Choose two different accounts for a transfer' }), 'Choose two different accounts for a transfer')
  assert.match(userFacingError(429, null), /wait a minute/)
  assert.match(userFacingError(401, null), /sign in again/)
  assert.match(userFacingError(409, null), /Refresh/)
})

test('appearance boot restores only a valid explicit choice and tolerates blocked storage', () => {
  for (const [saved, expected] of [['dark','dark'], ['light','light'], ['invalid','light'], [null,'light']]) {
    const document = { documentElement: { dataset: {} as Record<string,string> } }
    runInNewContext(appearanceBoot, { document, localStorage: { getItem: () => saved } })
    assert.equal(document.documentElement.dataset.appearance, expected)
  }
  const document = { documentElement: { dataset: {} as Record<string,string> } }
  runInNewContext(appearanceBoot, { document, localStorage: { getItem: () => { throw Error('Storage blocked') } } })
  assert.equal(document.documentElement.dataset.appearance, 'light')
})
