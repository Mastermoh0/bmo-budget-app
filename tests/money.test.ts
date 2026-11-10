import 'dotenv/config'
import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { randomUUID, randomInt } from 'node:crypto'
import { prisma } from '../lib/db'
import { cents, decimal, calendarDate, monthTotals } from '../lib/money-math'
import { splitAssignments } from '../lib/quick-budget'

const origin = process.env.BETTER_AUTH_URL!
assert.equal(process.env.BIMO_DATABASE_TARGET, 'bimo_modern_test')
assert.equal(new URL(process.env.DATABASE_URL!).pathname, '/bimo_modern_test')
class Browser {
  cookie = ''
  ip = `198.${randomInt(18,20)}.${randomInt(256)}.${randomInt(1,255)}`
  async call(path: string, body?: unknown, host = origin, extra: Record<string, string> = {}) {
    const response = await fetch(new URL(path, host), { method: body === undefined ? 'GET' : 'POST', body: body === undefined ? undefined : JSON.stringify(body), headers: { Origin: host, Cookie: this.cookie, 'Content-Type': 'application/json', 'x-forwarded-for': this.ip, 'x-vercel-forwarded-for': this.ip, ...extra } })
    if (response.headers.getSetCookie().length) this.cookie = response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ')
    return response
  }
}
async function result(response: Response, expected = 200) {
  const data = await response.json()
  assert.equal(response.status, expected, `HTTP ${response.status}: ${data.error ?? data.code ?? 'unknown error'}`)
  return data
}
async function identity() {
  const browser = new Browser(), email = `money-${randomUUID()}@example.invalid`, password = 'Local money engine passphrase 2026!'
  await result(await browser.call('/api/auth/sign-up/email', { name: 'Money engine fixture', email, password }))
  // Verification delivery is covered by foundation.test; this fixture isolates money permissions.
  const user = await prisma.user.update({ where: { email }, data: { emailVerified: true } })
  await result(await browser.call('/api/auth/sign-in/email', { email, password }))
  return { browser, user }
}
async function fixture() {
  const { browser, user } = await identity()
  const budget = await result(await browser.call('/api/budgets', { requestId: randomUUID(), name: 'Money contract check', currency: 'NGN', timezone: 'Africa/Lagos' }), 201)
  const path = `/api/budgets/${budget.id}/money`
  const save = async (body: object, expected = 200) => result(await browser.call(path, { requestId: randomUUID(), ...body }), expected)
  const read = async (month = '2026-09', page = 1) => result(await browser.call(`${path}?month=${month}&page=${page}`))
  const account = async (amount = '10000.00', name = 'Everyday') => save({ action: 'account', name, kind: 'BANK', date: '2026-09-01', amount })
  const category = async (name = 'Groceries') => save({ action: 'category', name })
  const post = async (kind: string, accountId: string, amount: string, categoryId?: string, toAccountId?: string, date = '2026-09-10') => save({ action: 'post', kind, accountId, amount, categoryId, toAccountId, date })
  const assign = async (categoryId: string, amount: string, month = '2026-09') => save({ action: 'assign', categoryId, amount, month, revision: (await read(month)).budget.revision })
  return { browser, user, budget, path, save, read, account, category, post, assign }
}
after(async () => { await prisma.$disconnect() })

test('Quick Budget: exact splits, atomic application, retries, stale previews and saved templates', async () => {
  const f = await fixture(); await f.account('10000.00')
  const food = await f.category('Food'), transport = await f.category('Transport'), savings = await f.category('Savings')
  const portions = [{ label: 'Needs', percent: 80, categoryIds: [food.id,transport.id] }, { label: 'Savings', percent: 20, categoryIds: [savings.id] }]
  const tiny = splitAssignments('0.03', portions)
  assert.equal(tiny.reduce((sum,row) => sum+cents(row.amount),0n),3n)
  assert.deepEqual(tiny.map(row => row.amount),['0.01','0.01','0.01'])
  assert.throws(() => splitAssignments('100', [{ ...portions[0], percent: 90 }]))
  const revision = (await f.read()).budget.revision
  const body = { requestId: randomUUID(), action: 'quick-budget', month: '2026-09', amount: '1000.01', portions, revision }
  await result(await f.browser.call(f.path, body)); await result(await f.browser.call(f.path, body))
  let snapshot = await f.read()
  assert.equal(snapshot.readyToAssign, '8999.99'); assert.equal(snapshot.totalBalance, '10000.00')
  assert.deepEqual(snapshot.categories.map((row: { assigned: string }) => row.assigned).sort(), ['200.00','400.00','400.01'])
  await f.save({ ...body, requestId: randomUUID(), revision },409)
  await f.save({ ...body, requestId: randomUUID(), revision: snapshot.budget.revision, amount: '10000' },400)
  await f.save({ ...body, requestId: randomUUID(), revision: snapshot.budget.revision, portions: [{...portions[0], categoryIds: [food.id,savings.id]},portions[1]] },400)
  await f.save({ ...body, requestId: randomUUID(), revision: snapshot.budget.revision, portions: [{...portions[0], categoryIds: [food.id,'missing']},portions[1]] },400)
  assert.equal((await f.read()).readyToAssign,'8999.99')
  const split = { id: randomUUID(), name: 'My salary', portions }
  await f.save({ action: 'save-split', revision: snapshot.budget.revision, split })
  snapshot = await f.read(); assert.deepEqual(snapshot.quickBudgetSplits,[split])
  await f.save({ action: 'save-split', revision: snapshot.budget.revision, split: {...split,name:'Updated salary'} })
  snapshot = await f.read(); assert.equal(snapshot.quickBudgetSplits.length,1); assert.equal(snapshot.quickBudgetSplits[0].name,'Updated salary')
  const outsider = await identity()
  await result(await outsider.browser.call(f.path,{ ...body,requestId:randomUUID(),revision:snapshot.budget.revision }),404)
  await prisma.budgetMember.create({data:{budgetId:f.budget.id,userId:outsider.user.id,role:'VIEWER'}})
  for (const command of [{...body,requestId:randomUUID()}, {action:'save-split',split,requestId:randomUUID()}, {action:'delete-split',id:split.id,requestId:randomUUID()}]) await result(await outsider.browser.call(f.path,{...command,revision:snapshot.budget.revision}),403)
  await prisma.budgetMember.update({where:{budgetId_userId:{budgetId:f.budget.id,userId:outsider.user.id}},data:{role:'EDITOR'}})
  await result(await outsider.browser.call(f.path,{action:'save-split',split,requestId:randomUUID(),revision:snapshot.budget.revision}))
  snapshot = await f.read()
  await f.save({action:'delete-split',id:split.id,revision:snapshot.budget.revision})
  snapshot = await f.read(); assert.deepEqual(snapshot.quickBudgetSplits,[]); assert.equal(snapshot.readyToAssign,'8999.99')
})

test('exact money and calendar primitives reject malformed input', () => {
  assert.equal(decimal(cents('0.10') + cents('0.20')), '0.30')
  assert.equal(decimal(cents('999999999999999999.99')), '999999999999999999.99')
  for (const bad of ['1.001', 'NaN', 'Infinity', '1e3', '01', '', ' 1', '-1', 3]) assert.throws(() => cents(bad))
  assert.throws(() => calendarDate('2026-02-30'))
  assert.equal(calendarDate('2026-10-31').toISOString().slice(0, 10), '2026-10-31')
  const totals = monthTotals('2026-10', [{ month: '2026-09', categoryId: 'food', amount: '5000.00' }], [{ month: '2026-09', categoryId: 'food', amount: '-6000.00' }], [{ month: '2026-09', amount: '10000.00' }])
  assert.equal(totals.readyToAssign, 400000n); assert.equal(totals.categories.get('food')?.available, 0n)
})

test('M01–M04: openings, received income, expenses and internal transfers reconcile', async () => {
  const f = await fixture(), a = await f.account('50000.00'), b = await f.account('10000.00', 'Savings'), c = await f.category()
  let snapshot = await f.read()
  assert.equal(snapshot.totalBalance, '60000.00'); assert.equal(snapshot.readyToAssign, '60000.00'); assert.equal(snapshot.report.income, '0.00'); assert.equal(snapshot.report.opening, '60000.00')
  await f.assign(c.id, '5000.00')
  await f.post('INCOME', a.id, '5000.00')
  await f.post('EXPENSE', a.id, '3000.00', c.id)
  await f.post('TRANSFER', a.id, '2000.00', undefined, b.id)
  snapshot = await f.read()
  assert.equal(snapshot.accounts.find((row: { id: string }) => row.id === a.id).balance, '50000.00')
  assert.equal(snapshot.accounts.find((row: { id: string }) => row.id === b.id).balance, '12000.00')
  assert.equal(snapshot.totalBalance, '62000.00'); assert.equal(snapshot.report.netSpending, '3000.00'); assert.equal(snapshot.report.income, '5000.00'); assert.equal(snapshot.categories[0].available, '2000.00')
  for (const suffix of ['', '/accounts', '/transactions', '/reports', '/activity']) {
    const response = await f.browser.call(`/budgets/${f.budget.id}${suffix}?month=2026-09`)
    assert.equal(response.status, 200); const html = await response.text(); assert.match(html, /Money contract check/)
  }
})

test('M05–M08: category moves, transfer fees, same-month and later refunds', async () => {
  const f = await fixture(), a = await f.account(), b = await f.account('2000.00', 'Savings'), c = await f.category(), transport = await f.category('Transport')
  await f.assign(c.id, '5000.00'); await f.assign(transport.id, '2000.00')
  await f.save({ action: 'move', categoryId: c.id, toCategoryId: transport.id, amount: '1000.00', month: '2026-09', revision: (await f.read()).budget.revision })
  let snapshot = await f.read()
  assert.equal(snapshot.totalBalance, '12000.00'); assert.equal(snapshot.categories.find((row: { id: string }) => row.id === c.id).available, '4000.00')
  await f.post('TRANSFER', a.id, '1000.00', undefined, b.id); await f.post('EXPENSE', a.id, '50.00', transport.id)
  snapshot = await f.read(); assert.equal(snapshot.accounts[0].balance, '8950.00'); assert.equal(snapshot.accounts[1].balance, '3000.00'); assert.equal(snapshot.report.expenses, '50.00')
  await f.post('EXPENSE', a.id, '3000.00', c.id); await f.post('REFUND', a.id, '1000.00', c.id)
  snapshot = await f.read(); assert.equal(snapshot.categories[0].available, '2000.00'); assert.equal(snapshot.report.netSpending, '2050.00'); assert.equal(snapshot.report.income, '0.00')
  await f.post('REFUND', a.id, '1000.00', c.id, undefined, '2026-10-01')
  snapshot = await f.read('2026-10'); assert.equal(snapshot.categories[0].carry, '2000.00'); assert.equal(snapshot.categories[0].available, '3000.00'); assert.equal(snapshot.report.refunds, '1000.00')
})

test('M09–M10, M16: correcting and voiding keep identity, recompute carry, preserve audit', async () => {
  const f = await fixture(), a = await f.account(), c = await f.category()
  await f.assign(c.id, '5000.00')
  const expense = await f.post('EXPENSE', a.id, '3000.00', c.id)
  assert.equal((await f.read('2026-10')).categories[0].carry, '2000.00')
  const edit = { action: 'edit', id: expense.id, version: expense.version, kind: 'EXPENSE', accountId: a.id, categoryId: c.id, date: '2026-09-10', amount: '2500.00', memo: 'Corrected amount' }
  await f.save(edit)
  let snapshot = await f.read('2026-10'); assert.equal(snapshot.totalBalance, '7500.00'); assert.equal(snapshot.categories[0].carry, '2500.00')
  await f.save(edit, 409)
  await f.save({ action: 'void', id: expense.id, version: 2 })
  snapshot = await f.read(); assert.equal(snapshot.totalBalance, '10000.00'); assert.equal(snapshot.categories[0].available, '5000.00'); assert.equal(snapshot.report.netSpending, '0.00'); assert(snapshot.transactions.find((row: { id: string }) => row.id === expense.id).voided)
  const audit = await prisma.moneyOperation.findMany({ where: { budgetId: f.budget.id, action: { in: ['edit', 'void'] } } })
  assert.equal(audit.length, 2); assert(audit.every(row => row.before && row.after && row.actorUserId === f.user.id))
})

test('M11: concurrent cross-instance retries post once and conflicting reuse fails', async () => {
  const f = await fixture(), a = await f.account(), c = await f.category()
  const request = { requestId: randomUUID(), action: 'post', kind: 'EXPENSE', accountId: a.id, categoryId: c.id, date: '2026-09-11', amount: '100.00' }
  const replies = await Promise.all(Array.from({ length: 8 }, (_, index) => f.browser.call(f.path, request, index % 2 ? process.env.TEST_SECOND_ORIGIN : origin)))
  const saved = await Promise.all(replies.map(response => result(response)))
  assert.equal(new Set(saved.map(row => row.id)).size, 1)
  assert.equal((await f.read()).totalBalance, '9900.00')
  await result(await f.browser.call(f.path, { ...request, amount: '200.00' }), 409)
  assert.equal(await prisma.moneyOperation.count({ where: { budgetId: f.budget.id, requestId: request.requestId } }), 1)
})

test('transfer corrections, opening corrections and voids conserve both accounts exactly', async () => {
  const f = await fixture(), a = await f.account('10000.00'), b = await f.account('0.00', 'Savings')
  const transfer = await f.post('TRANSFER', a.id, '2000.00', undefined, b.id)
  await f.save({ action: 'edit', id: transfer.id, version: 1, kind: 'TRANSFER', accountId: a.id, toAccountId: b.id, amount: '1500.00', date: '2026-09-12' })
  let snapshot = await f.read()
  assert.equal(snapshot.accounts[0].balance, '8500.00'); assert.equal(snapshot.accounts[1].balance, '1500.00'); assert.equal(snapshot.report.netSpending, '0.00')
  await f.save({ action: 'void', id: transfer.id, version: 2 })
  snapshot = await f.read(); assert.equal(snapshot.accounts[0].balance, '10000.00'); assert.equal(snapshot.accounts[1].balance, '0.00')
  await f.save({ action: 'edit', id: a.transactionId, version: 1, kind: 'OPENING', accountId: a.id, amount: '999999999999999999.99', date: '2026-09-01' })
  snapshot = await f.read(); assert.equal(snapshot.totalBalance, '999999999999999999.99'); assert.equal(snapshot.readyToAssign, '999999999999999999.99')
  assert.equal(snapshot.report.income, '0.00')
  const category = await f.category()
  await f.assign(category.id, '100.00'); await f.assign(category.id, '-40.00')
  snapshot = await f.read(); assert.equal(snapshot.categories[0].available, '60.00'); assert.equal(snapshot.readyToAssign, '999999999999999939.99')
  await f.save({ action: 'account-state', id: b.id, version: 1, name: 'Savings', inactive: true })
  await f.save({ action: 'edit', id: b.transactionId, version: 1, kind: 'OPENING', accountId: b.id, amount: '1.00', date: '2026-09-01' }, 400)
})

test('M12: a database failure on the second transfer entry rolls back money, operation and revision', async () => {
  const f = await fixture(), a = await f.account(), b = await f.account('0.00', 'Savings')
  const before = await f.read(), key = randomUUID()
  // A test-only database trigger exercises the real HTTP save path, without production fault switches.
  await prisma.$executeRawUnsafe(`CREATE FUNCTION bimo_test_transfer_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.position=1 AND NEW."accountId"='${b.id}' THEN RAISE EXCEPTION 'Synthetic transfer failure'; END IF; RETURN NEW; END; $$`)
  await prisma.$executeRawUnsafe('CREATE TRIGGER bimo_test_transfer_failure BEFORE INSERT ON "MoneyEntry" FOR EACH ROW EXECUTE FUNCTION bimo_test_transfer_failure()')
  try {
    await result(await f.browser.call(f.path, { requestId: key, action: 'post', kind: 'TRANSFER', accountId: a.id, toAccountId: b.id, amount: '1000.00', date: '2026-09-12' }), 500)
    const snapshot = await f.read(); assert.equal(snapshot.totalBalance, before.totalBalance); assert.equal(snapshot.budget.revision, before.budget.revision); assert.deepEqual(snapshot.accounts, before.accounts)
    assert.equal(await prisma.moneyOperation.count({ where: { budgetId: f.budget.id, requestId: key } }), 0)
  } finally {
    await prisma.$executeRawUnsafe('DROP TRIGGER bimo_test_transfer_failure ON "MoneyEntry"')
    await prisma.$executeRawUnsafe('DROP FUNCTION bimo_test_transfer_failure()')
  }
})

test('M13–M15, M17: rollover, overspending and future reserves apply once', async () => {
  const f = await fixture(), a = await f.account(), c = await f.category()
  await f.assign(c.id, '5000.00'); await f.post('EXPENSE', a.id, '3000.00', c.id)
  let snapshot = await f.read('2026-10'); assert.equal(snapshot.categories[0].carry, '2000.00'); assert.equal(snapshot.readyToAssign, '5000.00')
  const expense = (await f.read()).transactions.find((row: { kind: string }) => row.kind === 'EXPENSE')
  await f.save({ action: 'edit', id: expense.id, version: expense.version, kind: 'EXPENSE', accountId: a.id, categoryId: c.id, amount: '6000.00', date: '2026-09-10' })
  snapshot = await f.read(); assert.equal(snapshot.categories[0].available, '-1000.00'); assert.equal(snapshot.totalBalance, '4000.00')
  snapshot = await f.read('2026-10'); assert.equal(snapshot.categories[0].available, '0.00'); assert.equal(snapshot.readyToAssign, '4000.00')
  assert.equal((await f.read('2026-11')).readyToAssign, '4000.00')
  await f.assign(c.id, '1000.00'); snapshot = await f.read('2026-10'); assert.equal(snapshot.readyToAssign, '4000.00'); assert.equal(snapshot.pastOverspending, '0.00')
  await f.assign(c.id, '3000.00', '2026-11'); snapshot = await f.read(); assert.equal(snapshot.totalBalance, '4000.00'); assert.equal(snapshot.readyToAssign, '1000.00'); assert.equal(snapshot.futureAssigned, '3000.00')
  const stale = { action: 'assign', categoryId: c.id, amount: '1.00', month: '2026-09', revision: snapshot.budget.revision - 1 }
  await f.save(stale, 409)
})

test('M18–M20: external payments, exact kobo, date boundaries, closure and archive history', async () => {
  const f = await fixture(), a = await f.account('10.00'), c = await f.category()
  await f.assign(c.id, '10.00')
  await f.post('EXPENSE', a.id, '0.10', c.id); await f.post('EXPENSE', a.id, '0.20', c.id)
  assert.equal((await f.read()).accounts[0].balance, '9.70')
  await f.save({ action: 'account-state', id: a.id, name: 'Everyday', inactive: true, version: 1 }, 400)
  await f.post('EXPENSE', a.id, '9.70', c.id)
  await f.save({ action: 'account-state', id: a.id, name: 'Everyday', inactive: true, version: 1 })
  await f.save({ action: 'post', kind: 'INCOME', accountId: a.id, amount: '1.00', date: '2026-09-30' }, 400)
  await f.save({ action: 'category-state', id: c.id, name: 'Groceries', inactive: true, version: 1 })
  let snapshot = await f.read(); assert.equal(snapshot.report.expenses, '10.00'); assert.equal(snapshot.transactions.length, 4); assert.equal(snapshot.categories[0].archived, true)
  await f.save({ action: 'account-state', id: a.id, name: 'Everyday reopened', inactive: false, version: 2 })
  await f.save({ action: 'post', kind: 'EXPENSE', accountId: a.id, categoryId: c.id, amount: '1.00', date: '2026-09-30' }, 400)
  await f.save({ action: 'category-state', id: c.id, name: 'Groceries', inactive: false, version: 2 })
  await f.post('EXPENSE', a.id, '1.00', c.id, undefined, '2026-09-30')
  snapshot = await f.read(); assert.equal(snapshot.accounts[0].balance, '-1.00'); assert.equal(snapshot.categories[0].available, '-1.00'); assert(snapshot.transactions.some((row: { date: string }) => row.date === '2026-09-30'))
})

test('permissions, forged relations, malformed amounts, origin and direct database posting constraints', async () => {
  const f = await fixture(), stranger = await identity(), a = await f.account(), c = await f.category()
  const body = { action: 'post', kind: 'EXPENSE', accountId: a.id, categoryId: c.id, date: '2026-09-01', amount: '100.00', requestId: randomUUID() }
  await result(await stranger.browser.call(f.path), 404)
  await prisma.budgetMember.create({ data: { budgetId: f.budget.id, userId: stranger.user.id, role: 'VIEWER' } })
  await result(await stranger.browser.call(f.path), 200); await result(await stranger.browser.call(f.path, body), 403)
  const viewerPage = await (await stranger.browser.call(`/budgets/${f.budget.id}/transactions`)).text(); assert.match(viewerPage, /view-only access/); assert.doesNotMatch(viewerPage, /<h2>Add a transaction/)
  await prisma.budgetMember.update({ where: { budgetId_userId: { budgetId: f.budget.id, userId: stranger.user.id } }, data: { role: 'EDITOR' } })
  await result(await stranger.browser.call(f.path, body))
  await prisma.budgetMember.delete({ where: { budgetId_userId: { budgetId: f.budget.id, userId: stranger.user.id } } })
  await result(await stranger.browser.call(f.path), 404); await result(await stranger.browser.call(f.path, { ...body, requestId: randomUUID() }), 404)
  await result(await f.browser.call(f.path, body, origin, { Origin: 'https://untrusted.example' }), 403)
  for (const value of ['0', '-1', '1.001', '1e3', 'NaN', '9999999999999999999.99', 100, null]) await f.save({ ...body, amount: value, requestId: randomUUID() }, 400)
  await f.save({ action: 'account', name: 'Negative opening', kind: 'BANK', amount: '-1.00', date: '2026-09-01' }, 400)
  await f.save({ ...body, date: '2199-01-01', requestId: randomUUID() }, 400)
  await f.save({ ...body, categoryId: 'another-budget-category', requestId: randomUUID() }, 400)
  await f.save({ ...body, kind: 'TRANSFER', categoryId: null, toAccountId: a.id, requestId: randomUUID() }, 400)
  const otherBudget = await prisma.budget.create({ data: { creatorUserId: f.user.id, ownerUserId: f.user.id, requestId: randomUUID(), creationFingerprint: 'fixture', name: 'Other isolated budget' } })
  const foreign = await prisma.moneyAccount.create({ data: { budgetId: otherBudget.id, name: 'Other budget account', kind: 'BANK' } })
  await f.save({ ...body, kind: 'TRANSFER', categoryId: null, toAccountId: foreign.id, requestId: randomUUID() }, 400)
  await assert.rejects(prisma.moneyTransaction.create({ data: { budgetId: f.budget.id, kind: 'TRANSFER', date: new Date('2026-09-01'), entries: { create: [{ position: 0, amount: '-1.00', accountId: a.id }] } } }), error => error instanceof Error && error.message.includes('Invalid Bimo transfer posting'))
  await assert.rejects(prisma.moneyTransaction.create({ data: { budgetId: f.budget.id, kind: 'INCOME', date: new Date('2026-09-01'), entries: { create: [{ position: 0, amount: '1.00', accountId: foreign.id }] } } }), error => Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'P2003'))
})

test('bounded pagination and CSV preserve void status and escape spreadsheet formulas', async () => {
  const f = await fixture(), a = await f.account(), c = await f.category('=FORMULA')
  for (let index = 0; index < 51; index++) await f.save({ action: 'post', kind: 'EXPENSE', accountId: a.id, categoryId: c.id, amount: '1.00', date: '2026-09-02', memo: index === 0 ? '=1+1' : `Payment ${index}` })
  const first = await f.read(), second = await f.read('2026-09', 2)
  assert.equal(first.transactions.length, 50); assert.equal(first.hasNext, true); assert.equal(second.transactions.length, 2)
  assert.equal(new Set([...first.transactions, ...second.transactions].map(row => row.id)).size, 52)
  const csvResponse = await f.browser.call(`/api/budgets/${f.budget.id}/export?month=2026-09`)
  assert.equal(csvResponse.status, 200); assert.equal(csvResponse.headers.get('cache-control'), 'private, no-store')
  const csv = await csvResponse.text(); assert.equal(csv.split('\r\n').length, 53); assert(csv.includes('"\'=FORMULA"')); assert(csv.includes('"\'=1+1"'))
  await result(await f.browser.call(`${f.path}?month=2026-13`), 400)
  await result(await f.browser.call(`${f.path}?page=-1`), 400)
})

test('category groups preserve money through placement, ordering, archival and reopening', async () => {
  const f = await fixture(), account = await f.account(), category = await f.category()
  await f.assign(category.id, '5000.00'); await f.post('EXPENSE', account.id, '1000.00', category.id)
  const original = await f.read()
  const essentials = await f.save({ action: 'group', name: 'Essentials' }), savings = await f.save({ action: 'group', name: 'Savings' })
  await f.save({ action: 'category-state', id: category.id, version: 1, name: 'Groceries', inactive: false, groupId: essentials.id })
  const transport = await f.save({ action: 'category', name: 'Transport', groupId: essentials.id })
  await f.save({ action: 'reorder', kind: 'category', id: transport.id, version: 1, direction: 'up' })
  let snapshot = await f.read()
  assert.deepEqual(snapshot.categories.filter((row: { groupId: string | null }) => row.groupId === essentials.id).map((row: { name: string }) => row.name), ['Transport', 'Groceries'])
  await f.save({ action: 'reorder', kind: 'category', id: transport.id, version: 1, direction: 'down' }, 409)
  await f.save({ action: 'reorder', kind: 'group', id: savings.id, version: 1, direction: 'up' })
  snapshot = await f.read(); assert.deepEqual(snapshot.groups.map((row: { name: string }) => row.name), ['Savings', 'Essentials'])
  await f.save({ action: 'group-state', id: essentials.id, version: snapshot.groups.find((row: { id: string }) => row.id === essentials.id).version, name: 'Essentials', inactive: true }, 400)
  for (const row of snapshot.categories) await f.save({ action: 'category-state', id: row.id, version: row.version, name: row.name, inactive: true })
  const groupVersion = snapshot.groups.find((row: { id: string }) => row.id === essentials.id).version
  await f.save({ action: 'group-state', id: essentials.id, version: groupVersion, name: 'Archived essentials', inactive: true })
  snapshot = await f.read()
  assert.equal(snapshot.totalBalance, original.totalBalance); assert.equal(snapshot.readyToAssign, original.readyToAssign); assert.deepEqual(snapshot.report, original.report)
  assert.equal(snapshot.categories.find((row: { id: string }) => row.id === category.id).available, '4000.00')
  const archived = snapshot.categories.find((row: { id: string }) => row.id === category.id)
  await f.save({ action: 'category-state', id: archived.id, version: archived.version, name: archived.name, inactive: false }, 400)
  await f.save({ action: 'category-state', id: archived.id, version: archived.version, name: archived.name, inactive: false, groupId: null })
  snapshot = await f.read(); assert.equal(snapshot.categories.find((row: { id: string }) => row.id === category.id).groupId, null)
  const group = snapshot.groups.find((row: { id: string }) => row.id === essentials.id)
  await f.save({ action: 'group-state', id: group.id, version: group.version, name: 'Essentials reopened', inactive: false })
  assert.equal((await f.read()).groups.find((row: { id: string }) => row.id === essentials.id).archived, false)
})

test('monthly targets guide contributions without creating or changing money records', async () => {
  const f = await fixture(), account = await f.account(), category = await f.category()
  const before = await f.read(), entries = await prisma.moneyEntry.count({ where: { budgetId: f.budget.id } })
  await f.save({ action: 'set-target', categoryId: category.id, version: 0, kind: 'MONTHLY', amount: '5000.00', startMonth: '2026-09' })
  let snapshot = await f.read()
  assert.equal(snapshot.totalBalance, before.totalBalance); assert.equal(snapshot.readyToAssign, before.readyToAssign); assert.equal(snapshot.categories[0].target.saved, '0.00')
  await f.assign(category.id, '3000.00'); await f.post('EXPENSE', account.id, '1000.00', category.id); await f.post('REFUND', account.id, '200.00', category.id)
  snapshot = await f.read(); assert.equal(snapshot.categories[0].target.saved, '3000.00'); assert.equal(snapshot.categories[0].target.remaining, '2000.00'); assert.equal(snapshot.categories[0].target.percent, 60)
  const next = await f.read('2026-10'); assert.equal(next.categories[0].carry, '2200.00'); assert.equal(next.categories[0].target.saved, '0.00')
  await f.assign(category.id, '2000.00'); assert.equal((await f.read()).categories[0].target.status, 'COMPLETE')
  const target = (await f.read()).categories[0].target
  await f.save({ action: 'remove-target', categoryId: category.id, version: target.version })
  snapshot = await f.read(); assert(snapshot.categories[0].target.removed); assert.equal(snapshot.categories[0].available, '4200.00')
  assert.equal(await prisma.moneyEntry.count({ where: { budgetId: f.budget.id } }), entries + 2)
  await f.save({ action: 'set-target', categoryId: category.id, version: snapshot.categories[0].target.version, kind: 'MONTHLY', amount: '6000.00', startMonth: '2026-09' })
  assert.equal((await f.read()).categories[0].target.removed, false)
  const page = await f.browser.call(`/budgets/${f.budget.id}/targets?month=2026-09`)
  assert.equal(page.status, 200); assert.match(await page.text(), /Savings targets guide your plan/)
})

test('date targets follow exact availability after spending, refunds, corrections and future views', async () => {
  const f = await fixture(), account = await f.account(), category = await f.category()
  await f.save({ action: 'set-target', categoryId: category.id, version: 0, kind: 'BY_DATE', amount: '10000.00', startMonth: '2026-09', dueDate: '2026-12-31' })
  await f.assign(category.id, '4000.00')
  let snapshot = await f.read(); assert.equal(snapshot.categories[0].target.suggested, '1500.00'); assert.equal(snapshot.categories[0].target.saved, '4000.00')
  const expense = await f.post('EXPENSE', account.id, '1000.00', category.id)
  await f.post('REFUND', account.id, '500.00', category.id)
  snapshot = await f.read(); assert.equal(snapshot.categories[0].target.saved, '3500.00'); assert.equal(snapshot.categories[0].target.remaining, '6500.00')
  await f.save({ action: 'edit', id: expense.id, version: 1, kind: 'EXPENSE', accountId: account.id, categoryId: category.id, amount: '500.00', date: '2026-09-10' })
  snapshot = await f.read('2026-10'); assert.equal(snapshot.categories[0].target.saved, '4000.00'); assert.equal(snapshot.categories[0].target.suggested, '2000.00')
  assert.equal((await f.read('2027-01')).categories[0].target.status, 'OVERDUE')
  assert.equal((await f.read('2026-08')).categories[0].target.status, 'NOT_STARTED')
})

test('target retries are atomic across instances, stale changes conflict and previous settings remain auditable', async () => {
  const f = await fixture(), category = await f.category()
  const body = { requestId: randomUUID(), action: 'set-target', categoryId: category.id, version: 0, kind: 'MONTHLY', amount: '100.00', startMonth: '2026-09' }
  const responses = await Promise.all(Array.from({ length: 8 }, (_, index) => f.browser.call(f.path, body, index % 2 ? process.env.TEST_SECOND_ORIGIN : origin)))
  const targets = await Promise.all(responses.map(response => result(response)))
  assert.equal(new Set(targets.map(row => row.id)).size, 1)
  await result(await f.browser.call(f.path, { ...body, amount: '200.00' }), 409)
  await f.save({ ...body, requestId: randomUUID(), amount: '200.00' }, 409)
  await f.save({ ...body, requestId: randomUUID(), version: 1, amount: '200.00' })
  await f.save({ action: 'remove-target', categoryId: category.id, version: 1 }, 409)
  await f.save({ action: 'remove-target', categoryId: category.id, version: 2 })
  const operations = await prisma.moneyOperation.findMany({ where: { budgetId: f.budget.id, action: { in: ['set-target', 'remove-target'] } }, orderBy: { createdAt: 'asc' } })
  assert.equal(operations.length, 3); assert(operations[1].before && operations[1].after); assert(operations[2].before && operations[2].after)
  assert.equal(await prisma.categoryTarget.count({ where: { budgetId: f.budget.id } }), 1)
})

test('groups and targets enforce viewer/editor/removal, origin, foreign references and validation', async () => {
  const f = await fixture(), other = await identity(), category = await f.category()
  const target = { action: 'set-target', categoryId: category.id, version: 0, kind: 'MONTHLY', amount: '100.00', startMonth: '2026-09', requestId: randomUUID() }
  await prisma.budgetMember.create({ data: { budgetId: f.budget.id, userId: other.user.id, role: 'VIEWER' } })
  await result(await other.browser.call(f.path, target), 403)
  await result(await other.browser.call(f.path, { action: 'group', name: 'No viewer writes', requestId: randomUUID() }), 403)
  const page = await other.browser.call(`/budgets/${f.budget.id}/targets`); const html = await page.text(); assert.match(html, /view-only access/); assert.doesNotMatch(html, /<summary>Add target/)
  await prisma.budgetMember.update({ where: { budgetId_userId: { budgetId: f.budget.id, userId: other.user.id } }, data: { role: 'EDITOR' } })
  await result(await other.browser.call(f.path, target))
  await prisma.budgetMember.delete({ where: { budgetId_userId: { budgetId: f.budget.id, userId: other.user.id } } })
  await result(await other.browser.call(f.path, { ...target, requestId: randomUUID(), version: 1 }), 404)
  await result(await f.browser.call(f.path, { ...target, requestId: randomUUID(), version: 1 }, origin, { Origin: 'https://untrusted.example' }), 403)
  for (const amount of ['0.00', '-1.00', '1.001', '1e3', '9999999999999999999.00', 100]) await f.save({ ...target, requestId: randomUUID(), version: 1, amount }, 400)
  await f.save({ ...target, requestId: randomUUID(), version: 1, kind: 'BY_DATE', dueDate: '2026-08-31' }, 400)
  await f.save({ ...target, requestId: randomUUID(), version: 1, kind: 'BY_DATE', dueDate: '2026-09-31' }, 400)
  await f.save({ ...target, requestId: randomUUID(), version: 1, kind: 'MONTHLY', dueDate: '2026-09-30' }, 400)
  const foreignBudget = await prisma.budget.create({ data: { creatorUserId: f.user.id, ownerUserId: f.user.id, name: 'Foreign group fixture', requestId: randomUUID(), creationFingerprint: 'fixture' } })
  const foreignGroup = await prisma.categoryGroup.create({ data: { budgetId: foreignBudget.id, name: 'Private foreign group' } })
  await f.save({ action: 'category-state', id: category.id, version: 1, name: 'Groceries', inactive: false, groupId: foreignGroup.id }, 400)
  await assert.rejects(prisma.budgetCategory.update({ where: { id: category.id }, data: { groupId: foreignGroup.id } }), error => Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'P2003'))
  await assert.rejects(prisma.categoryTarget.create({ data: { budgetId: foreignBudget.id, categoryId: category.id, kind: 'MONTHLY', amount: '100.00', startMonth: new Date('2026-09-01') } }), error => Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'P2003'))
})

test('target funding includes negative availability and negative monthly contributions', async () => {
  const f = await fixture(), account = await f.account(), category = await f.category()
  await f.save({ action: 'set-target', categoryId: category.id, version: 0, kind: 'BY_DATE', amount: '1000.00', startMonth: '2026-09', dueDate: '2026-09-30' })
  await f.post('EXPENSE', account.id, '100.00', category.id)
  let snapshot = await f.read()
  assert.equal(snapshot.categories[0].available, '-100.00'); assert.equal(snapshot.categories[0].target.saved, '0.00'); assert.equal(snapshot.categories[0].target.remaining, '1100.00')
  await f.assign(category.id, '1100.00')
  snapshot = await f.read(); assert.equal(snapshot.categories[0].target.status, 'COMPLETE'); assert.equal(snapshot.categories[0].available, '1000.00')
  const monthly = await fixture(), monthlyCategory = await monthly.category()
  await monthly.account()
  await monthly.assign(monthlyCategory.id, '4000.00')
  await monthly.save({ action: 'set-target', categoryId: monthlyCategory.id, version: 0, kind: 'MONTHLY', amount: '5000.00', startMonth: '2026-10' })
  await monthly.assign(monthlyCategory.id, '-1000.00', '2026-10')
  snapshot = await monthly.read('2026-10'); assert.equal(snapshot.categories[0].target.remaining, '6000.00'); assert.equal(snapshot.categories[0].target.shortfall, '1000.00')
  await monthly.assign(monthlyCategory.id, '6000.00', '2026-10')
  snapshot = await monthly.read('2026-10'); assert.equal(snapshot.categories[0].target.status, 'COMPLETE'); assert.equal(snapshot.categories[0].assigned, '5000.00')
})
