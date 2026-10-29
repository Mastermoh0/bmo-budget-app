import 'dotenv/config'
import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { randomUUID, randomInt } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { prisma } from '../lib/db'
import { assertDatabaseTarget } from '../lib/database-target'
import { consumeAccountLimit } from '../lib/throttle'
import { deliverWelcome } from '../lib/mail'

const origin = process.env.BETTER_AUTH_URL!
assert.equal(process.env.BIMO_DATABASE_TARGET, 'bimo_modern_test', 'Tests must never use the old or development database')
assert.equal(new URL(process.env.DATABASE_URL!).pathname, '/bimo_modern_test')
const password = 'Bimo local passphrase 2026!'
class Browser {
  cookies = new Map<string, string>()
  ip = `198.${randomInt(18,20)}.${randomInt(256)}.${randomInt(1,255)}`
  async call(path: string, data?: unknown, method = data === undefined ? 'GET' : 'POST', host = origin, extra: Record<string, string> = {}) {
    const response = await fetch(new URL(path, host), {
      method, redirect: 'manual', body: data === undefined ? undefined : JSON.stringify(data),
      headers: { ...(data === undefined ? {} : { 'Content-Type': 'application/json' }), Origin: host, Cookie: [...this.cookies].map(([key, value]) => `${key}=${value}`).join('; '), 'x-vercel-forwarded-for': this.ip, 'x-forwarded-for': this.ip, ...extra },
    })
    for (const item of response.headers.getSetCookie()) {
      const pair = item.split(';')[0]; const index = pair.indexOf('=')
      if (index > 0) { const name = pair.slice(0, index); const value = pair.slice(index + 1); if (value) this.cookies.set(name, value); else this.cookies.delete(name) }
    }
    return response
  }
}
async function status(response: Response, expected: number) {
  if (response.status !== expected) {
    const data = await response.json().catch(() => ({}))
    assert.fail(`Expected HTTP ${expected}, got ${response.status}; code ${typeof data.code === 'string' ? data.code : 'none'}`)
  }
}
async function mailLink(email: string, subject: string) {
  assert(email.endsWith('@example.invalid'), 'Only synthetic recipients may be inspected')
  for (let attempt = 0; attempt < 100; attempt++) {
    const listing = await (await fetch('http://127.0.0.1:8025/api/v1/messages')).json()
    const message = listing.messages.find((item: { Subject: string; To: { Address: string }[] }) => item.Subject === subject && item.To.some(to => to.Address === email))
    if (message) {
      const detail = await (await fetch(`http://127.0.0.1:8025/api/v1/message/${message.ID}`)).json()
      const link = String(detail.Text).match(/https?:\/\/[^\s<>]+/)?.[0]
      assert(link, 'Expected a local link in the captured test message')
      assert.equal(new URL(link).origin, origin, 'Auth email must use the configured local origin')
      return link
    }
    await delay(100)
  }
  assert.fail('Expected local auth message did not arrive')
}
async function signup(browser: Browser, email: string) {
  const response = await browser.call('/api/auth/sign-up/email', { name: 'Local foundation check', email, password, callbackURL: '/setup' })
  await status(response, 200)
  const link = await mailLink(email, 'Verify your Bimo email')
  const verified = await browser.call(link)
  assert([200, 302].includes(verified.status), 'Verification should complete without a server error')
  const sessionResponse = await browser.call('/api/auth/get-session')
  const session = await sessionResponse.json()
  assert(session?.user.emailVerified, 'Verified identity should have a real session')
  return session
}
async function signin(browser: Browser, email: string, value = password) {
  const response = await browser.call('/api/auth/sign-in/email', { email, password: value })
  await status(response, 200)
  return (await (await browser.call('/api/auth/get-session')).json())
}
after(async () => { await prisma.$disconnect() })

test('fresh auth and private-budget foundation through two production instances', async t => {
  const owner = new Browser(), other = new Browser()
  const email = `owner-${randomUUID()}@example.invalid`
  const otherEmail = `other-${randomUUID()}@example.invalid`
  let ownerId = '', otherId = '', budgetId = '', firstSessionId = ''

  await t.test('health, anonymous API denial, and no legacy-cookie bridge', async () => {
    assert.throws(() => assertDatabaseTarget('postgresql://local@127.0.0.1:5432/budget_app'))
    assert.throws(() => assertDatabaseTarget('postgresql://local@127.0.0.1:5433/unidentified'))
    await status(await owner.call('/api/auth/ok'), 200)
    await status(await owner.call('/api/budgets'), 401)
    owner.cookies.set('next-auth.session-token', 'legacy-cookie-must-not-work')
    await status(await owner.call('/api/budgets'), 401)
    owner.cookies.clear()
  })
  await t.test('server-rendered credential forms cannot submit passwords through GET before hydration', async () => {
    for (const action of ['signin', 'signup', 'reset-password']) {
      const response = await owner.call(`/auth/${action}`)
      const html = await response.text()
      assert.match(html, /<form[^>]*method="post"/i, 'Credential forms require a safe native POST fallback')
      assert.match(html, /<button[^>]*disabled[^>]*>/i, 'Submission must wait for client handlers')
      assert.doesNotMatch(html, /<form[^>]*method="get"/i)
    }
  })
  await t.test('password validation and unverified users cannot reach budgets', async () => {
    await status(await owner.call('/api/auth/sign-up/email', { name: 'Short password', email: `short-${randomUUID()}@example.invalid`, password: 'short' }), 400)
    await status(await owner.call('/api/auth/sign-up/email', { name: 'Owner', email, password, callbackURL: '/setup' }), 200)
    await status(await owner.call('/api/auth/sign-in/email', { email, password }), 403)
    await status(await owner.call('/api/budgets'), 401)
  })
  await t.test('captured verification creates a session and one welcome, with no automatic budget', async () => {
    const link = await mailLink(email, 'Verify your Bimo email')
    const verified = await owner.call(link)
    assert([200, 302].includes(verified.status))
    const session = await (await owner.call('/api/auth/get-session')).json()
    assert.equal(session.user.emailVerified, true)
    ownerId = session.user.id; firstSessionId = session.session.id
    assert.equal((await (await owner.call('/api/budgets')).json()).length, 0)
    const credential = await prisma.account.findFirstOrThrow({ where: { userId: ownerId, providerId: 'credential' } })
    assert(credential.password && credential.password !== password, 'Password must be hashed by Better Auth')
    for (let attempt = 0; attempt < 30; attempt++) { if ((await prisma.emailOutbox.findUnique({ where: { eventKey: `welcome:${ownerId}` } }))?.status === 'SENT') break; await delay(100) }
    assert.equal((await prisma.emailOutbox.findUniqueOrThrow({ where: { eventKey: `welcome:${ownerId}` } })).status, 'SENT')
    assert(verified.headers.getSetCookie().some(cookie => cookie.includes('HttpOnly') && cookie.includes('bimo-foundation')), 'Auth cookie must be HttpOnly and separate from legacy cookies')
  })
  await t.test('retry-safe budget creation and conflicting request rejection', async () => {
    const request = { name: 'Private foundation budget', currency: 'NGN', timezone: 'Africa/Lagos', requestId: randomUUID(), ownerUserId: 'forged-owner' }
    const results = await Promise.all(Array.from({ length: 8 }, () => owner.call('/api/budgets', request)))
    for (const response of results) await status(response, 201)
    const budgets = await prisma.budget.findMany({ where: { ownerUserId: ownerId, requestId: request.requestId } })
    assert.equal(budgets.length, 1); budgetId = budgets[0].id
    await status(await owner.call('/api/budgets', { ...request, name: 'Conflicting retry' }), 409)
    await status(await owner.call('/api/budgets', { ...request, requestId: randomUUID() }, 'POST', origin, { Origin: 'https://untrusted.example' }), 403)
    const read = await owner.call(`/api/budgets/${budgetId}`)
    assert.equal(read.headers.get('cache-control'), 'private, no-store')
  })
  await t.test('unrelated users, viewer/editor permissions, revocation and protected ownership', async () => {
    const session = await signup(other, otherEmail); otherId = session.user.id
    await status(await other.call(`/api/budgets/${budgetId}`), 404)
    await prisma.budgetMember.create({ data: { budgetId, userId: otherId, role: 'VIEWER' } })
    await status(await other.call(`/api/budgets/${budgetId}`), 200)
    await status(await other.call(`/api/budgets/${budgetId}`, { name: 'Viewer change' }, 'PATCH'), 403)
    await status(await owner.call(`/api/budgets/${budgetId}`, { ownerUserId: otherId }, 'PATCH'), 400)
    await prisma.budgetMember.update({ where: { budgetId_userId: { budgetId, userId: otherId } }, data: { role: 'EDITOR' } })
    await status(await other.call(`/api/budgets/${budgetId}`, { name: 'Editor change' }, 'PATCH'), 200)
    await prisma.budgetMember.delete({ where: { budgetId_userId: { budgetId, userId: otherId } } })
    await status(await other.call(`/api/budgets/${budgetId}`), 404)
    assert((await (await other.call('/api/auth/get-session')).json()).user, 'Budget removal must not destroy the identity session')
    await assert.rejects(prisma.user.delete({ where: { id: ownerId } }), error => Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'P2003'))
    await status(await owner.call('/api/transactions', { amount: -100 }), 410)
    await status(await owner.call('/api/user/delete', {}, 'DELETE'), 410)
    await status(await owner.call('/api/auth/delete-user', { password }), 404)
  })
  await t.test('origin checks and last login method protection', async () => {
    await status(await owner.call('/api/auth/sign-in/email', { email, password }, 'POST', origin, { Origin: 'https://untrusted.example' }), 403)
    const account = await prisma.account.findFirstOrThrow({ where: { userId: ownerId, providerId: 'credential' } })
    await status(await owner.call('/api/auth/unlink-account', { accountId: account.id }), 400)
    await status(await owner.call('/api/auth/sign-in/social', { provider: 'google', callbackURL: '/' }), 404)
  })
  await t.test('freshness requires reauthentication, not renewal', async () => {
    await prisma.session.update({ where: { id: firstSessionId }, data: { createdAt: new Date(Date.now() - 16 * 60000) } })
    await status(await owner.call('/api/auth/change-email', { newEmail: `fresh-${randomUUID()}@example.invalid`, callbackURL: '/settings' }), 403)
    await status(await owner.call('/api/security/add-password', { newPassword: 'Another local password 2026!' }), 403)
  })
  let second: Browser
  await t.test('forgot-password is generic and reset revokes two real sessions', async () => {
    await signin(owner, email)
    second = new Browser(); await signin(second, email)
    const known = await owner.call('/api/auth/request-password-reset', { email, redirectTo: '/auth/reset-password' })
    const unknown = await other.call('/api/auth/request-password-reset', { email: `missing-${randomUUID()}@example.invalid`, redirectTo: '/auth/reset-password' })
    assert.equal(known.status, unknown.status); assert.deepEqual(await known.json(), await unknown.json())
    const callback = await owner.call(await mailLink(email, 'Reset your Bimo password'))
    const location = callback.headers.get('location'); assert(location)
    const token = new URL(location, origin).searchParams.get('token'); assert(token)
    await status(await owner.call('/api/auth/reset-password', { token, newPassword: password + ' changed' }), 200)
    await status(await owner.call('/api/budgets'), 401)
    await status(await second.call('/api/budgets'), 401)
    await status(await owner.call('/api/auth/reset-password', { token, newPassword: password + ' replay' }), 400)
    await status(await owner.call('/api/auth/sign-in/email', { email, password }), 401)
    await signin(owner, email, password + ' changed')
    assert.equal(await prisma.emailOutbox.count({ where: { userId: ownerId } }), 1)
  })
  await t.test('password change revokes another device and sign-out-all removes access', async () => {
    const another = new Browser(); await signin(another, email, password + ' changed')
    await status(await owner.call('/api/auth/change-password', { currentPassword: password + ' changed', newPassword: password + ' final', revokeOtherSessions: true }), 200)
    await status(await another.call('/api/budgets'), 401)
    await status(await owner.call('/api/budgets'), 200)
    await status(await owner.call('/api/auth/revoke-sessions', {}), 200)
    await status(await owner.call('/api/budgets'), 401)
  })
  await t.test('expired recovery links cannot change a password', async () => {
    const browser = new Browser()
    await status(await browser.call('/api/auth/request-password-reset', { email, redirectTo: '/auth/reset-password' }), 200)
    const callback = await browser.call(await mailLink(email, 'Reset your Bimo password'))
    const location = callback.headers.get('location'); assert(location)
    const token = new URL(location, origin).searchParams.get('token'); assert(token)
    const changed = await prisma.verification.updateMany({ where: { identifier: { contains: token } }, data: { expiresAt: new Date(Date.now() - 1000) } })
    assert.equal(changed.count, 1, 'This fixture must expire exactly its own reset record')
    await status(await browser.call('/api/auth/reset-password', { token, newPassword: password + ' expired' }), 400)
    await signin(browser, email, password + ' final')
  })
  await t.test('verified email change confirms both addresses and preserves budget identity', async () => {
    const browser = new Browser(); await signin(browser, email, password + ' final')
    const newEmail = `changed-${randomUUID()}@example.invalid`
    await status(await browser.call('/api/auth/change-email', { newEmail, callbackURL: '/settings' }), 200)
    assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: ownerId } })).email, email)
    const approval = await browser.call(await mailLink(email, 'Approve your Bimo email change'))
    assert([200, 302].includes(approval.status))
    const verification = await browser.call(await mailLink(newEmail, 'Verify your Bimo email'))
    assert([200, 302].includes(verification.status))
    const saved = await prisma.user.findUniqueOrThrow({ where: { id: ownerId } })
    assert.equal(saved.email, newEmail); assert.equal(saved.emailVerified, true)
    assert.equal((await prisma.budget.findUniqueOrThrow({ where: { id: budgetId } })).ownerUserId, ownerId)
    assert.equal(await prisma.emailOutbox.count({ where: { userId: ownerId } }), 1)
  })
  await t.test('specific device revocation, expiry, and sign-out take effect server-side', async () => {
    const first = new Browser(), device = new Browser()
    await signin(first, otherEmail)
    const deviceSession = await signin(device, otherEmail)
    await status(await first.call('/api/auth/revoke-session', { token: deviceSession.session.token }), 200)
    await status(await device.call('/api/budgets'), 401)
    const session = await (await first.call('/api/auth/get-session')).json()
    await prisma.session.update({ where: { id: session.session.id }, data: { expiresAt: new Date(Date.now() - 1000) } })
    await status(await first.call('/api/budgets'), 401)
    await signin(first, otherEmail)
    await status(await first.call('/api/auth/sign-out', {}), 200)
    await status(await first.call('/api/budgets'), 401)
  })
  await t.test('shared database rate limiting is atomic across two app instances', async () => {
    const browser = new Browser()
    const responses = await Promise.all(Array.from({ length: 12 }, (_, index) => browser.call('/api/auth/sign-in/email', { email: `rate-${randomUUID()}@example.invalid`, password }, 'POST', index % 2 ? process.env.TEST_SECOND_ORIGIN! : origin)))
    assert.equal(responses.filter(response => response.status === 429).length, 7)
    assert(responses.every(response => response.status === 401 || response.status === 429))
    assert(await prisma.rateLimit.count() > 0)
  })
  await t.test('a simulated Google-only account can add a password after verified fresh identity proof', async () => {
    const browser = new Browser(); await signin(browser, otherEmail)
    await prisma.account.deleteMany({ where: { userId: otherId, providerId: 'credential' } })
    const google = await prisma.account.create({ data: { id: randomUUID(), accountId: `fixture-${randomUUID()}`, providerId: 'google', userId: otherId } })
    await status(await browser.call('/api/auth/unlink-account', { accountId: google.id }), 400)
    await status(await browser.call('/api/security/add-password', { newPassword: password + ' added' }), 200)
    const credential = await prisma.account.findFirstOrThrow({ where: { userId: otherId, providerId: 'credential' } })
    assert(credential.password && credential.password !== password + ' added')
    await status(await browser.call('/api/auth/unlink-account', { accountId: google.id }), 200)
    assert.equal(await prisma.account.count({ where: { userId: otherId } }), 1)
    await status(await browser.call('/api/auth/unlink-account', { accountId: credential.id }), 400)
    await status(await browser.call('/api/auth/sign-out', {}), 200)
    await signin(browser, otherEmail, password + ' added')
  })
  await t.test('custom server-side mutation limits are atomic and recover after expiry', async () => {
    const scope = `test-${randomUUID()}`
    const outcomes = await Promise.allSettled(Array.from({ length: 10 }, () => consumeAccountLimit(scope, ownerId, 3)))
    assert.equal(outcomes.filter(outcome => outcome.status === 'fulfilled').length, 3)
    assert.equal(outcomes.filter(outcome => outcome.status === 'rejected').length, 7)
    await prisma.rateLimit.update({ where: { key: `bimo:${scope}:${ownerId}` }, data: { lastRequest: BigInt(Date.now() - 61000) } })
    await consumeAccountLimit(scope, ownerId, 3)
    assert.equal((await prisma.rateLimit.findUniqueOrThrow({ where: { key: `bimo:${scope}:${ownerId}` } })).count, 1)
  })
  await t.test('failed welcome delivery backs off and stops after three attempts', async () => {
    const userId = randomUUID()
    await prisma.user.create({ data: { id: userId, name: 'Mail failure fixture', email: `mail-${randomUUID()}@example.invalid`, emailVerified: true } })
    const eventKey = `welcome:${userId}`
    await prisma.emailOutbox.create({ data: { userId, eventKey } })
    const originalPort = process.env.SMTP_PORT
    try {
      process.env.SMTP_PORT = '1'
      await deliverWelcome(userId)
      let event = await prisma.emailOutbox.findUniqueOrThrow({ where: { eventKey } })
      assert.equal(event.status, 'PENDING'); assert.equal(event.attempts, 1)
      await deliverWelcome(userId)
      assert.equal((await prisma.emailOutbox.findUniqueOrThrow({ where: { eventKey } })).attempts, 1, 'Backoff must prevent an immediate resend')
      for (let attempt = 0; attempt < 2; attempt++) {
        await prisma.emailOutbox.update({ where: { eventKey }, data: { nextAttemptAt: new Date(Date.now() - 1000) } })
        await deliverWelcome(userId)
      }
      event = await prisma.emailOutbox.findUniqueOrThrow({ where: { eventKey } })
      assert.equal(event.status, 'FAILED'); assert.equal(event.attempts, 3)
    } finally { process.env.SMTP_PORT = originalPort }
  })
})
