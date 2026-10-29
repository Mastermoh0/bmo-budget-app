import 'dotenv/config'
import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { randomUUID, createHash, randomInt } from 'node:crypto'
import { prisma } from '../lib/db'

const origin = process.env.BETTER_AUTH_URL!
assert.equal(process.env.BIMO_DATABASE_TARGET, 'bimo_modern_test')
assert.equal(new URL(process.env.DATABASE_URL!).pathname, '/bimo_modern_test')
class Browser {
  cookie = ''; ip = `198.${randomInt(18,20)}.${randomInt(256)}.${randomInt(1,255)}`
  async call(path: string, body?: unknown, host = origin, headers: Record<string, string> = {}) {
    const response = await fetch(new URL(path, host), { method: body === undefined ? 'GET' : 'POST', headers: { Origin: host, Cookie: this.cookie, 'Content-Type': 'application/json', 'x-forwarded-for': this.ip, 'x-vercel-forwarded-for': this.ip, ...headers }, body: body === undefined ? undefined : JSON.stringify(body) })
    if (response.headers.getSetCookie().length) this.cookie = response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ')
    return response
  }
}
async function result(response: Response, status = 200) { const data = await response.json(); assert.equal(response.status, status, data.error); return data }
async function identity() {
  const browser = new Browser(), email = `desktop-${randomUUID()}@example.invalid`, password = 'Local desktop household passphrase!'
  await result(await browser.call('/api/auth/sign-up/email', { name: 'Desktop household fixture', email, password }))
  const user = await prisma.user.update({ where: { email }, data: { emailVerified: true } })
  await result(await browser.call('/api/auth/sign-in/email', { email, password }))
  return { browser, user }
}
async function fixture() {
  const owner = await identity(), request = { requestId: randomUUID(), name: 'Desktop household checks', currency: 'NGN', timezone: 'Africa/Lagos' }
  const budget = await result(await owner.browser.call('/api/budgets', request), 201), base = `/api/budgets/${budget.id}`
  const money = (body: object, status = 200) => owner.browser.call(`${base}/money`, { requestId: randomUUID(), ...body }).then(r => result(r, status))
  const snapshot = () => owner.browser.call(`${base}/money?month=2026-09`).then(r => result(r))
  const sharing = (browser = owner.browser) => browser.call(`${base}/sharing`).then(r => result(r))
  const manage = async (body: object, status = 200) => result(await owner.browser.call(`${base}/sharing`, { requestId: randomUUID(), revision: (await sharing()).budget.revision, ...body }), status)
  return { owner, budget, request, base, money, snapshot, sharing, manage }
}
async function token(email: string, ownership = false) {
  assert(email.endsWith('@example.invalid'))
  const listing = await (await fetch('http://127.0.0.1:8025/api/v1/messages')).json()
  const message = listing.messages.find((row: { Subject: string; To: { Address: string }[] }) => row.Subject === (ownership ? 'Bimo ownership offer' : 'Bimo household invitation') && row.To.some(to => to.Address === email))
  assert(message, 'Expected invitation in local Mailpit')
  const detail = await (await fetch(`http://127.0.0.1:8025/api/v1/message/${message.ID}`)).json()
  const value = String(detail.Text).match(/\/invitations#([A-Za-z0-9_-]{43})/)?.[1]
  assert(value); return value
}
after(() => prisma.$disconnect())

test('desktop filters, payees, reports and exports reconcile without changing budget totals', async () => {
  const f = await fixture(), account = await f.money({ action: 'account', name: 'Everyday', kind: 'BANK', amount: '10000.00', date: '2026-09-01' }), savings = await f.money({ action: 'account', name: 'Savings', kind: 'SAVINGS', amount: '0.00', date: '2026-09-01' }), group = await f.money({ action: 'group', name: 'Essentials' }), category = await f.money({ action: 'category', name: 'Food', groupId: group.id })
  const post = { action: 'post', kind: 'EXPENSE', accountId: account.id, categoryId: category.id, amount: '3000.00', date: '2026-09-10', payee: '=Market, "A"', memo: 'Groceries 100%_done' }
  const expense = await f.money(post)
  await f.money({ action: 'post', kind: 'REFUND', accountId: account.id, categoryId: category.id, amount: '500.00', date: '2026-09-11', payee: 'Market', memo: 'Returned item' })
  await f.money({ action: 'post', kind: 'TRANSFER', accountId: account.id, toAccountId: savings.id, amount: '1000.00', date: '2026-09-12' })
  const read = async (query: string) => result(await f.owner.browser.call(`${f.base}/money?month=2026-09&${query}`))
  const snapshot = await f.snapshot(); assert.equal(snapshot.totalBalance, '7500.00'); assert.equal(snapshot.report.netSpending, '2500.00')
  for (const query of ['q=100%25_done', `categoryId=${category.id}&groupId=${group.id}&from=2026-09-10&to=2026-09-10`, 'q=%3Dmarket']) {
    const filtered = await read(query); assert.equal(filtered.transactions.length, 1); assert.equal(filtered.transactions[0].id, expense.id); assert.equal(filtered.filteredReport.netSpending, '3000.00'); assert.equal(filtered.totalBalance, '7500.00')
  }
  const incoming = await read(`accountId=${savings.id}`); assert.equal(incoming.transactions.length, 2); assert.equal(incoming.filteredReport.netSpending, '0.00'); assert.equal(incoming.filteredReport.income, '0.00')
  assert.equal((await read('q=not-present')).transactions.length, 0)
  await result(await f.owner.browser.call(`${f.base}/money?month=2026-09&from=2026-10-01`), 400)
  await result(await f.owner.browser.call(`${f.base}/money?month=2026-09&from=2026-09-20&to=2026-09-01`), 400)
  await f.money({ ...post, action: 'edit', id: expense.id, version: 1, payee: 'Corrected market', amount: '2500.00' })
  assert.equal((await read('q=Corrected')).transactions[0].payee, 'Corrected market')
  const csv = await (await f.owner.browser.call(`${f.base}/export?month=2026-09&q=Returned`)).text(); assert.equal(csv.split('\r\n').length, 2); assert.match(csv, /"Payee"/)
  const report = await (await f.owner.browser.call(`${f.base}/report?month=2026-09&categoryId=${category.id}`)).text(); assert.match(report, /"netSpending","2000.00"/)
  const portable = await result(await f.owner.browser.call(`${f.base}/portable`)); assert.equal(portable.format, 'bimo-finances'); assert.equal(portable.transactions.length, 5); assert(!JSON.stringify(portable).includes(f.owner.user.email)); assert(!JSON.stringify(portable).includes('tokenHash'))
  await f.money({ action: 'void', id: expense.id, version: 2 })
  assert.equal((await read('status=voided')).transactions.length, 1); assert.equal((await read('status=active')).transactions.length, 4)
  assert.equal((await read('status=voided')).filteredReport.netSpending, '-500.00') // Reports always exclude voids; status only filters transaction lists.
})

test('shared notes are versioned, audited and do not move money; viewers cannot edit', async () => {
  const f = await fixture(), group = await f.money({ action: 'group', name: 'Essentials' }), category = await f.money({ action: 'category', name: 'Food', groupId: group.id }), viewer = await identity()
  await f.money({ action: 'account', kind: 'BANK', name: 'Everyday', amount: '1000.00', date: '2026-09-01' })
  for (const [kind, id] of [['category', category.id], ['group', group.id]]) {
    const request = { requestId: randomUUID(), action: 'note', kind, id, version: 1, note: 'Household note\n<script>text only</script>' }
    await f.money(request); await f.money(request)
    await f.money({ ...request, requestId: randomUUID(), note: 'Stale' }, 409)
  }
  const s = await f.snapshot(); assert.equal(s.totalBalance, '1000.00'); assert.match(s.categories[0].note, /script/); assert.equal(s.groups[0].version, 2)
  await prisma.budgetMember.create({ data: { budgetId: f.budget.id, userId: viewer.user.id, role: 'VIEWER' } })
  await result(await viewer.browser.call(`${f.base}/money`, { requestId: randomUUID(), action: 'note', kind: 'category', id: category.id, version: 2, note: 'Denied' }), 403)
  assert.equal(await prisma.moneyOperation.count({ where: { budgetId: f.budget.id, action: 'note' } }), 2)
  await f.money({ action: 'note', kind: 'category', id: category.id, version: 2, note: 'x'.repeat(1001) }, 400)
})

test('invitations require verified recipient, retry once, revoke, expire, and enforce owner-only administration', async () => {
  const f = await fixture(), viewer = await identity(), stranger = await identity()
  const body = { requestId: randomUUID(), revision: 0, action: 'invite', email: viewer.user.email, role: 'VIEWER' }
  const invited = await result(await f.owner.browser.call(`${f.base}/sharing`, body)), originalToken = await token(viewer.user.email)
  await result(await f.owner.browser.call(`${f.base}/sharing`, body, process.env.TEST_SECOND_ORIGIN))
  assert.equal(await prisma.budgetInvitation.count({ where: { budgetId: f.budget.id } }), 1)
  const row = await prisma.budgetInvitation.findUniqueOrThrow({ where: { id: invited.invitationId } }); assert.equal(row.tokenHash, createHash('sha256').update(originalToken).digest('hex')); assert.equal(row.delivery, 'SENT')
  await result(await stranger.browser.call('/api/invitations', { action: 'preview', token: originalToken }), 403)
  await result(await viewer.browser.call('/api/invitations', { action: 'preview', token: originalToken }))
  const acceptance = { action: 'accept', token: originalToken, requestId: randomUUID() }
  const results = await Promise.all([viewer.browser.call('/api/invitations', acceptance), viewer.browser.call('/api/invitations', acceptance, process.env.TEST_SECOND_ORIGIN)]); for (const response of results) await result(response)
  assert.equal(await prisma.budgetMember.count({ where: { budgetId: f.budget.id } }), 1)
  assert.equal(await prisma.moneyOperation.count({ where: { budgetId: f.budget.id, action: 'sharing-accept' } }), 1)
  const view = await f.sharing(viewer.browser); assert.equal(view.invitations.length, 0)
  for (const action of ['invite', 'role', 'remove', 'offer-ownership', 'revoke']) await result(await viewer.browser.call(`${f.base}/sharing`, { requestId: randomUUID(), revision: view.budget.revision, action }), 403)
  await f.manage({ action: 'remove', userId: f.owner.user.id, version: 1 }, 400)
  await f.manage({ action: 'leave' }, 400)
  await f.manage({ action: 'remove', userId: viewer.user.id, version: 1 })
  await result(await viewer.browser.call('/api/invitations', acceptance), 410)
  for (const suffix of ['money?month=2026-09', 'portable', 'report?month=2026-09', 'export?month=2026-09', 'sharing']) await result(await viewer.browser.call(`${f.base}/${suffix}`), 404)
  const pending = await f.manage({ action: 'invite', email: stranger.user.email, role: 'EDITOR' }), pendingToken = await token(stranger.user.email)
  await f.manage({ action: 'revoke', id: pending.invitationId }); await result(await stranger.browser.call('/api/invitations', { action: 'accept', token: pendingToken, requestId: randomUUID() }), 410)
  const expiring = await f.manage({ action: 'invite', email: stranger.user.email, role: 'EDITOR' }), expiryToken = await token(stranger.user.email)
  await prisma.budgetInvitation.update({ where: { id: expiring.invitationId }, data: { createdAt: new Date(Date.now() - 86400000), expiresAt: new Date(Date.now() - 1000) } })
  await result(await stranger.browser.call('/api/invitations', { action: 'accept', token: expiryToken, requestId: randomUUID() }), 410)
  await result(await f.owner.browser.call(`${f.base}/sharing`, { ...body, requestId: randomUUID() }), 409)
  await result(await f.owner.browser.call(`${f.base}/sharing`, { ...body, requestId: randomUUID() }, origin, { Origin: 'https://untrusted.example' }), 403)
})

test('ownership transfer requires the invited editor, preserves creation identity and supports voluntary departure', async () => {
  const f = await fixture(), editor = await identity(), viewer = await identity()
  await f.manage({ action: 'invite', email: editor.user.email, role: 'EDITOR' })
  await result(await editor.browser.call('/api/invitations', { action: 'accept', token: await token(editor.user.email), requestId: randomUUID() }))
  await f.manage({ action: 'invite', email: viewer.user.email, role: 'VIEWER' }); const oldPendingToken = await token(viewer.user.email)
  await f.manage({ action: 'offer-ownership', email: editor.user.email }); const offerToken = await token(editor.user.email, true)
  await result(await editor.browser.call('/api/invitations', { action: 'preview', token: offerToken })).then(data => assert.equal(data.role, 'OWNER'))
  const request = { action: 'accept', token: offerToken, requestId: randomUUID() }
  await result(await editor.browser.call('/api/invitations', request)); await result(await editor.browser.call('/api/invitations', request))
  const budget = await prisma.budget.findUniqueOrThrow({ where: { id: f.budget.id } }); assert.equal(budget.ownerUserId, editor.user.id); assert.equal(budget.creatorUserId, f.owner.user.id)
  await result(await f.owner.browser.call('/api/budgets', f.request), 409); assert.equal(await prisma.budget.count({ where: { creatorUserId: f.owner.user.id, requestId: f.request.requestId } }), 1)
  await result(await viewer.browser.call('/api/invitations', { action: 'accept', token: oldPendingToken, requestId: randomUUID() }), 410)
  const s = await f.sharing(); assert.equal(s.budget.role, 'EDITOR')
  await result(await f.owner.browser.call(`${f.base}/sharing`, { action: 'remove', userId: editor.user.id, requestId: randomUUID(), revision: s.budget.revision, version: 1 }), 403)
  await result(await f.owner.browser.call(`${f.base}/sharing`, { action: 'leave', requestId: randomUUID(), revision: s.budget.revision }))
  await result(await f.owner.browser.call(`${f.base}/sharing`), 404)
  assert.equal((await f.sharing(editor.browser)).budget.role, 'OWNER')
  await result(await editor.browser.call('/api/invitations', { action: 'accept', token: offerToken, requestId: randomUUID() }))
})

test('role changes take effect in an existing session and stale admin writes cannot undo them', async () => {
  const f = await fixture(), member = await identity()
  await f.manage({ action: 'invite', email: member.user.email, role: 'VIEWER' })
  await result(await member.browser.call('/api/invitations', { action: 'accept', token: await token(member.user.email), requestId: randomUUID() }))
  let state = await f.sharing()
  const request = { action: 'role', userId: member.user.id, version: 1, role: 'EDITOR', revision: state.budget.revision, requestId: randomUUID() }
  await result(await f.owner.browser.call(`${f.base}/sharing`, request))
  await result(await member.browser.call(`${f.base}/money`, { action: 'category', name: 'Editor can save', requestId: randomUUID() }))
  await result(await f.owner.browser.call(`${f.base}/sharing`, { ...request, requestId: randomUUID(), role: 'VIEWER' }), 409)
  await f.manage({ action: 'role', userId: member.user.id, version: 1, role: 'VIEWER' }, 409)
  await f.manage({ action: 'role', userId: member.user.id, version: 2, role: 'VIEWER' })
  await result(await member.browser.call(`${f.base}/money`, { action: 'category', name: 'Now denied', requestId: randomUUID() }), 403)
  state = await f.sharing(member.browser)
  assert.equal(state.budget.role, 'VIEWER')
  await result(await member.browser.call(`${f.base}/sharing`, { action: 'remove', userId: f.owner.user.id, version: 1, revision: state.budget.revision, requestId: randomUUID() }), 403)
})
