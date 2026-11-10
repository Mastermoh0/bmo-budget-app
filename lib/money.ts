import { createHash } from 'node:crypto'
import { Prisma } from '../generated/prisma/client'
import { prisma } from './db'
import { AccessError } from './errors'
import { budgetMonth, calendarDate, cents, decimal, monthTotals, todayLagos } from './money-math'
import { targetProgress } from './targets'
import { moneyFilters, transactionWhere, reportWhere, type FilterInput } from './money-filters'
import { practiceCommand } from './tutorial-guard'
import { splitAssignments, validatePortions, type SavedSplit, type SplitPortion } from './quick-budget'

type Tx = Prisma.TransactionClient
const kinds = ['INCOME', 'EXPENSE', 'TRANSFER', 'REFUND'] as const
type PostingKind = typeof kinds[number] | 'OPENING'
type Posting = { kind: PostingKind; date: Date; accountId: string; toAccountId: string | null; categoryId: string | null; amount: string; memo: string; payee?: string }
export type Command =
  | { action: 'quick-budget'; month: string; amount: string; portions: SplitPortion[]; revision: number }
  | { action: 'save-split'; split: SavedSplit; revision: number }
  | { action: 'delete-split'; id: string; revision: number }
  | { action: 'note'; kind: 'group' | 'category'; id: string; version: number; note: string }
  | { action: 'account'; name: string; kind: 'BANK' | 'SAVINGS' | 'CASH'; amount: string; date: Date }
  | { action: 'category'; name: string; groupId?: string | null }
  | { action: 'group'; name: string }
  | { action: 'group-state'; id: string; version: number; name: string; inactive: boolean }
  | { action: 'reorder'; kind: 'group' | 'category'; id: string; version: number; direction: 'up' | 'down' }
  | { action: 'set-target'; categoryId: string; version: number; kind: 'MONTHLY' | 'BY_DATE'; amount: string; startMonth: string; dueDate: string | null }
  | { action: 'remove-target'; categoryId: string; version: number }
  | ({ action: 'post' } & Posting)
  | ({ action: 'edit'; id: string; version: number } & Posting)
  | { action: 'void'; id: string; version: number }
  | { action: 'assign'; month: string; categoryId: string; amount: string; revision: number }
  | { action: 'move'; month: string; categoryId: string; toCategoryId: string; amount: string; revision: number }
  | { action: 'account-state' | 'category-state'; id: string; version: number; name: string; inactive: boolean; groupId?: string | null }

function text(value: unknown, label: string, max = 80) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new AccessError(400, `${label} is required (up to ${max} characters)`)
  return value.trim()
}
function integer(value: unknown) { if (!Number.isSafeInteger(value) || (value as number) < 0) throw new AccessError(400, 'A valid record version is required'); return value as number }
function amount(value: unknown, zero = false, signed = false) {
  if (typeof value !== 'string' || value.length > 22) throw new AccessError(400, 'Use an amount within 18 whole digits and two decimal places')
  const parsed = cents(value, signed)
  if (parsed > 99999999999999999999n || parsed < -99999999999999999999n) throw new AccessError(400, 'The amount is too large')
  if (!zero && parsed === 0n) throw new AccessError(400, 'The amount must be greater than zero')
  return decimal(parsed)
}
function date(value: unknown) {
  const parsed = calendarDate(value)
  if ((value as string) > todayLagos()) throw new AccessError(400, 'Record received money only. Future transactions are not supported yet.')
  return parsed
}
function posting(data: Record<string, unknown>, editing = false): Posting {
  if (![...kinds, ...(editing ? ['OPENING'] : [])].includes(data.kind as PostingKind)) throw new AccessError(400, 'Choose income, expense, transfer or refund')
  const kind = data.kind as PostingKind
  const categorized = kind === 'EXPENSE' || kind === 'REFUND'
  if (!categorized && data.categoryId) throw new AccessError(400, 'Income, opening balances and internal transfers cannot have a spending category')
  if (kind !== 'TRANSFER' && data.toAccountId) throw new AccessError(400, 'Only a transfer can have a destination account')
  if (data.memo !== undefined && (typeof data.memo !== 'string' || data.memo.length > 240)) throw new AccessError(400, 'Keep the note within 240 characters')
  if (data.payee !== undefined && (typeof data.payee !== 'string' || data.payee.length > 100)) throw new AccessError(400, 'Keep the payee within 100 characters')
  return { kind, date: date(data.date), accountId: text(data.accountId, 'Account'), toAccountId: kind === 'TRANSFER' ? text(data.toAccountId, 'Destination account') : null, categoryId: categorized ? text(data.categoryId, 'Category') : null, amount: amount(data.amount, kind === 'OPENING'), memo: typeof data.memo === 'string' ? data.memo.trim() : '', ...(data.payee !== undefined ? { payee: (data.payee as string).trim() } : {}) }
}
function command(body: unknown): { requestId: string; value: Command } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new AccessError(400, 'Financial details are required')
  const data = body as Record<string, unknown>
  const requestId = text(data.requestId, 'Request ID')
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) throw new AccessError(400, 'A valid request ID is required')
  switch (data.action) {
    case 'quick-budget': case 'save-split': {
      let portions: SplitPortion[]
      const source = data.action === 'save-split' ? data.split as SavedSplit : data
      try { portions = validatePortions(source?.portions) } catch (error) { throw new AccessError(400, (error as Error).message) }
      const revision = integer(data.revision)
      if (data.action === 'save-split') return { requestId, value: { action: 'save-split', revision, split: { id: text(source.id, 'Split ID'), name: text(source.name, 'Split name'), portions } } }
      return { requestId, value: { action: 'quick-budget', month: budgetMonth(data.month), amount: amount(data.amount), portions, revision } }
    }
    case 'delete-split': return { requestId, value: { action: 'delete-split', id: text(data.id, 'Split ID'), revision: integer(data.revision) } }
    case 'note': {
      if (!['group', 'category'].includes(data.kind as string) || typeof data.note !== 'string' || data.note.length > 1000) throw new AccessError(400, 'Choose a group/category and keep its note within 1,000 characters')
      return { requestId, value: { action: 'note', kind: data.kind as 'group' | 'category', id: text(data.id, 'Item'), version: integer(data.version), note: data.note.trim() } }
    }
    case 'account': {
      if (!['BANK', 'SAVINGS', 'CASH'].includes(data.kind as string)) throw new AccessError(400, 'Choose a bank, savings or cash account')
      return { requestId, value: { action: 'account', name: text(data.name, 'Account name'), kind: data.kind as 'BANK' | 'SAVINGS' | 'CASH', amount: amount(data.amount, true), date: date(data.date) } }
    }
    case 'category': return { requestId, value: { action: 'category', name: text(data.name, 'Category name'), ...(data.groupId !== undefined ? { groupId: data.groupId === null || data.groupId === '' ? null : text(data.groupId, 'Category group') } : {}) } }
    case 'group': return { requestId, value: { action: 'group', name: text(data.name, 'Group name') } }
    case 'reorder': {
      if (!['group', 'category'].includes(data.kind as string) || !['up', 'down'].includes(data.direction as string)) throw new AccessError(400, 'Choose an item and move it up or down')
      return { requestId, value: { action: 'reorder', kind: data.kind as 'group' | 'category', id: text(data.id, 'Item'), version: integer(data.version), direction: data.direction as 'up' | 'down' } }
    }
    case 'set-target': {
      if (data.kind !== 'MONTHLY' && data.kind !== 'BY_DATE') throw new AccessError(400, 'Choose a monthly or date-based target')
      const startMonth = budgetMonth(data.startMonth)
      const dueDate = data.kind === 'BY_DATE' ? calendarDate(data.dueDate).toISOString().slice(0, 10) : null
      if (data.kind === 'MONTHLY' && data.dueDate) throw new AccessError(400, 'Monthly targets do not have a final deadline')
      if (dueDate && dueDate < `${startMonth}-01`) throw new AccessError(400, 'The deadline must be on or after the target start month')
      return { requestId, value: { action: 'set-target', categoryId: text(data.categoryId, 'Category'), version: integer(data.version), kind: data.kind, amount: amount(data.amount), startMonth, dueDate } }
    }
    case 'remove-target': return { requestId, value: { action: 'remove-target', categoryId: text(data.categoryId, 'Category'), version: integer(data.version) } }
    case 'post': return { requestId, value: { action: 'post', ...posting(data) } }
    case 'edit': return { requestId, value: { action: 'edit', id: text(data.id, 'Transaction'), version: integer(data.version), ...posting(data, true) } }
    case 'void': return { requestId, value: { action: 'void', id: text(data.id, 'Transaction'), version: integer(data.version) } }
    case 'assign': return { requestId, value: { action: 'assign', month: budgetMonth(data.month), categoryId: text(data.categoryId, 'Category'), amount: amount(data.amount, false, true), revision: integer(data.revision) } }
    case 'move': return { requestId, value: { action: 'move', month: budgetMonth(data.month), categoryId: text(data.categoryId, 'Source category'), toCategoryId: text(data.toCategoryId, 'Destination category'), amount: amount(data.amount), revision: integer(data.revision) } }
    case 'account-state': case 'category-state': case 'group-state': {
      if (typeof data.inactive !== 'boolean') throw new AccessError(400, 'Choose whether to close or reopen this record')
      return { requestId, value: { action: data.action, id: text(data.id, 'Record'), version: integer(data.version), name: text(data.name, 'Name'), inactive: data.inactive, ...(data.action === 'category-state' && data.groupId !== undefined ? { groupId: data.groupId === null || data.groupId === '' ? null : text(data.groupId, 'Category group') } : {}) } }
    }
    default: throw new AccessError(400, 'This financial action is not supported')
  }
}

async function permission(tx: Tx, budgetId: string, userId: string, write = false) {
  const budget = await tx.budget.findFirst({ where: { id: budgetId, archivedAt: null, OR: [{ ownerUserId: userId }, { members: { some: { userId } } }] }, include: { members: { where: { userId }, select: { role: true } } } })
  if (!budget) throw new AccessError(404, 'Budget not found')
  const role = budget.ownerUserId === userId ? 'OWNER' : budget.members[0]?.role
  if (write && role !== 'OWNER' && role !== 'EDITOR') throw new AccessError(403, 'Viewers can read this budget but cannot change its money')
  return { ...budget, role }
}

async function account(tx: Tx, budgetId: string, id: string) {
  const saved = await tx.moneyAccount.findFirst({ where: { budgetId, id } })
  if (!saved || saved.closedAt) throw new AccessError(400, 'Choose an open account in this budget')
  return saved
}
async function category(tx: Tx, budgetId: string, id: string, allowArchived = false) {
  const saved = await tx.budgetCategory.findFirst({ where: { budgetId, id } })
  if (!saved || (!allowArchived && saved.archivedAt)) throw new AccessError(400, 'Choose an active category in this budget')
  return saved
}
async function group(tx: Tx, budgetId: string, id: string) {
  const saved = await tx.categoryGroup.findFirst({ where: { budgetId, id, archivedAt: null } })
  if (!saved) throw new AccessError(400, 'Choose an active group in this budget, or leave the category ungrouped')
  return saved
}
async function validatePosting(tx: Tx, budgetId: string, data: Posting, oldCategory?: string | null) {
  await account(tx, budgetId, data.accountId)
  if (data.toAccountId) {
    if (data.accountId === data.toAccountId) throw new AccessError(400, 'Choose two different accounts for a transfer')
    await account(tx, budgetId, data.toAccountId)
  }
  if (data.categoryId) await category(tx, budgetId, data.categoryId, data.categoryId === oldCategory)
}
function entries(data: Posting): Prisma.MoneyEntryUncheckedCreateWithoutTransactionInput[] {
  const negative = data.kind === 'EXPENSE' || data.kind === 'TRANSFER'
  return [{ accountId: data.accountId, position: 0, amount: decimal(cents(data.amount) * (negative ? -1n : 1n)) }, ...(data.toAccountId ? [{ accountId: data.toAccountId, position: 1, amount: data.amount }] : [])]
}
function record(data: unknown): Prisma.InputJsonValue { return JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue }
type MonthlyRow = { month: string; categoryId: string; amount: string }
async function aggregates(tx: Tx, budgetId: string) {
  const [assignments, activity, inflows] = await Promise.all([
    tx.$queryRaw<MonthlyRow[]>`SELECT to_char("month", 'YYYY-MM') AS month, "categoryId", "amount"::text AS amount FROM "BudgetAssignment" WHERE "budgetId"=${budgetId}`,
    tx.$queryRaw<MonthlyRow[]>`SELECT to_char(t."date", 'YYYY-MM') AS month, t."categoryId", SUM(e.amount)::text AS amount FROM "MoneyTransaction" t JOIN "MoneyEntry" e ON e."transactionId"=t.id AND e."budgetId"=t."budgetId" WHERE t."budgetId"=${budgetId} AND t."voidedAt" IS NULL AND t.kind IN ('EXPENSE','REFUND') GROUP BY 1,2`,
    tx.$queryRaw<{ month: string; amount: string }[]>`SELECT to_char(t."date", 'YYYY-MM') AS month, SUM(e.amount)::text AS amount FROM "MoneyTransaction" t JOIN "MoneyEntry" e ON e."transactionId"=t.id AND e."budgetId"=t."budgetId" WHERE t."budgetId"=${budgetId} AND t."voidedAt" IS NULL AND t.kind IN ('OPENING','INCOME') GROUP BY 1`,
  ])
  return { assignments, activity, inflows }
}
async function balance(tx: Tx, budgetId: string, accountId: string) {
  const result = await tx.moneyEntry.aggregate({ where: { budgetId, accountId, transaction: { voidedAt: null } }, _sum: { amount: true } })
  return cents(result._sum.amount?.toFixed(2) ?? '0.00', true)
}

export async function applyMoney(userId: string, budgetId: string, body: unknown) {
  const { requestId, value } = command(body)
  const fingerprint = createHash('sha256').update(JSON.stringify(value)).digest('hex')
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async tx => {
        // All financial writers lock this budget before reading permission or money.
        await tx.$queryRaw`SELECT id FROM "Budget" WHERE id=${budgetId} FOR UPDATE`
        const budget = await permission(tx, budgetId, userId, true)
        const existing = await tx.moneyOperation.findUnique({ where: { budgetId_requestId: { budgetId, requestId } } })
        if (existing) {
          if (existing.fingerprint !== fingerprint || existing.actorUserId !== userId) throw new AccessError(409, 'This request ID has already been used for different details')
          return existing.result
        }
        const practice = budget.isPractice ? await practiceCommand(tx, budgetId, userId, value) : null
        let result: Prisma.InputJsonValue = {}
        let before: Prisma.InputJsonValue | undefined
        let after: Prisma.InputJsonValue | undefined
        if (value.action === 'quick-budget' || value.action === 'save-split' || value.action === 'delete-split') {
          if (budget.moneyRevision !== value.revision) throw new AccessError(409, 'The budget changed. Refresh and review your split again.')
          if (value.action === 'quick-budget') {
            const changes = splitAssignments(value.amount, value.portions)
            for (const row of changes) await category(tx, budgetId, row.categoryId)
            const data = await aggregates(tx, budgetId)
            const totals = monthTotals(value.month, data.assignments, data.activity, data.inflows)
            if (totals.readyToAssign < cents(value.amount)) throw new AccessError(400, 'There is not enough ready-to-assign money for this split.')
            before = record(data.assignments.filter(row => row.month === value.month))
            const month = calendarDate(`${value.month}-01`)
            for (const row of changes) if (cents(row.amount) > 0n) await tx.budgetAssignment.upsert({ where: { budgetId_categoryId_month: { budgetId, categoryId: row.categoryId, month } }, create: { budgetId, categoryId: row.categoryId, month, amount: row.amount }, update: { amount: { increment: row.amount } } })
            after = record({ month: value.month, changes }); result = { month: value.month }
          } else {
            let splits = budget.quickBudgetSplits as SavedSplit[]
            before = record(splits)
            if (value.action === 'save-split') {
              for (const row of value.split.portions) for (const id of row.categoryIds) await category(tx, budgetId, id)
              if (splits.length >= 20 && !splits.some(row => row.id === value.split.id)) throw new AccessError(400, 'Keep up to 20 saved splits per budget.')
              splits = [...splits.filter(row => row.id !== value.split.id), value.split]
            } else {
              if (!splits.some(row => row.id === value.id)) throw new AccessError(404, 'Saved split not found')
              splits = splits.filter(row => row.id !== value.id)
            }
            await tx.budget.update({ where: { id: budgetId }, data: { quickBudgetSplits: splits } })
            after = record(splits); result = { saved: true }
          }
        } else if (value.action === 'note') {
          const saved = value.kind === 'category' ? await category(tx, budgetId, value.id, true) : await tx.categoryGroup.findFirst({ where: { budgetId, id: value.id } })
          if (!saved) throw new AccessError(404, 'Note item not found')
          if (saved.version !== value.version) throw new AccessError(409, 'This item changed. Refresh before saving its note.')
          const updated = value.kind === 'category'
            ? await tx.budgetCategory.update({ where: { id: saved.id }, data: { note: value.note, version: { increment: 1 } } })
            : await tx.categoryGroup.update({ where: { id: saved.id }, data: { note: value.note, version: { increment: 1 } } })
          before = record(saved); after = record(updated); result = { id: updated.id, version: updated.version }
        } else if (value.action === 'account') {
          const saved = await tx.moneyAccount.create({ data: { budgetId, name: value.name, kind: value.kind } })
          const opening: Posting = { kind: 'OPENING', accountId: saved.id, toAccountId: null, categoryId: null, amount: value.amount, date: value.date, memo: 'Opening balance' }
          const transaction = await tx.moneyTransaction.create({ data: { budgetId, kind: 'OPENING', date: value.date, memo: opening.memo, entries: { create: entries(opening) } } })
          result = { id: saved.id, transactionId: transaction.id, version: saved.version }; after = record({ ...saved, opening: value.amount })
        } else if (value.action === 'category') {
          if (value.groupId) await group(tx, budgetId, value.groupId)
          const last = await tx.budgetCategory.aggregate({ where: { budgetId, groupId: value.groupId ?? null }, _max: { sortOrder: true } })
          const saved = await tx.budgetCategory.create({ data: { budgetId, name: value.name, groupId: value.groupId ?? null, sortOrder: (last._max.sortOrder ?? -1) + 1 } })
          result = { id: saved.id, version: saved.version }; after = record(saved)
        } else if (value.action === 'group') {
          const last = await tx.categoryGroup.aggregate({ where: { budgetId }, _max: { sortOrder: true } })
          const saved = await tx.categoryGroup.create({ data: { budgetId, name: value.name, sortOrder: (last._max.sortOrder ?? -1) + 1 } })
          result = { id: saved.id, version: saved.version }; after = record(saved)
        } else if (value.action === 'group-state') {
          const saved = await tx.categoryGroup.findFirst({ where: { budgetId, id: value.id } })
          if (!saved) throw new AccessError(404, 'Group not found')
          if (saved.version !== value.version) throw new AccessError(409, 'This group changed. Refresh before trying again.')
          if (value.inactive && await tx.budgetCategory.count({ where: { budgetId, groupId: saved.id, archivedAt: null } })) throw new AccessError(400, 'Move or archive the active categories before archiving this group')
          const updated = await tx.categoryGroup.update({ where: { id: saved.id }, data: { name: value.name, archivedAt: value.inactive ? new Date() : null, version: { increment: 1 } } })
          before = record(saved); after = record(updated); result = { id: updated.id, version: updated.version }
        } else if (value.action === 'reorder') {
          const categoryItem = value.kind === 'category' ? await category(tx, budgetId, value.id) : null
          const current = categoryItem ?? await group(tx, budgetId, value.id)
          if (current.version !== value.version) throw new AccessError(409, 'This item changed. Refresh before moving it.')
          const orderBy = [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }] as const
          const siblings = value.kind === 'group'
            ? await tx.categoryGroup.findMany({ where: { budgetId, archivedAt: null }, orderBy: [...orderBy] })
            : await tx.budgetCategory.findMany({ where: { budgetId, groupId: categoryItem!.groupId, archivedAt: null }, orderBy: [...orderBy] })
          const index = siblings.findIndex(row => row.id === value.id), destination = index + (value.direction === 'up' ? -1 : 1)
          if (!siblings[destination]) throw new AccessError(400, 'This item is already at the end of the list')
          before = record(siblings)
          ;[siblings[index], siblings[destination]] = [siblings[destination], siblings[index]]
          for (const [sortOrder, row] of siblings.entries()) {
            if (row.sortOrder === sortOrder && row.id !== value.id && sortOrder !== index) continue
            if (value.kind === 'group') await tx.categoryGroup.update({ where: { id: row.id }, data: { sortOrder, version: { increment: 1 } } })
            else await tx.budgetCategory.update({ where: { id: row.id }, data: { sortOrder, version: { increment: 1 } } })
          }
          after = record(siblings.map((row, sortOrder) => ({ id: row.id, name: row.name, sortOrder }))); result = { id: value.id }
        } else if (value.action === 'set-target' || value.action === 'remove-target') {
          await category(tx, budgetId, value.categoryId, value.action === 'remove-target')
          const key = { budgetId_categoryId: { budgetId, categoryId: value.categoryId } }
          const saved = await tx.categoryTarget.findUnique({ where: key })
          if ((saved?.version ?? 0) !== value.version) throw new AccessError(409, 'This target changed. Refresh before saving it.')
          before = saved ? record(saved) : undefined
          if (value.action === 'remove-target') {
            if (!saved || saved.removedAt) throw new AccessError(400, 'This category has no active target')
            const updated = await tx.categoryTarget.update({ where: key, data: { removedAt: new Date(), version: { increment: 1 } } })
            after = record(updated); result = { id: updated.id, version: updated.version }
          } else {
            const details = { kind: value.kind, amount: value.amount, startMonth: calendarDate(`${value.startMonth}-01`), dueDate: value.dueDate ? calendarDate(value.dueDate) : null, removedAt: null }
            const updated = await tx.categoryTarget.upsert({ where: key, create: { budgetId, categoryId: value.categoryId, ...details }, update: { ...details, version: { increment: 1 } } })
            after = record(updated); result = { id: updated.id, version: updated.version }
          }
        } else if (value.action === 'post') {
          await validatePosting(tx, budgetId, value)
          const saved = await tx.moneyTransaction.create({ data: { budgetId, kind: value.kind, date: value.date, memo: value.memo, payee: value.payee, categoryId: value.categoryId, entries: { create: entries(value) } }, include: { entries: true } })
          result = { id: saved.id, version: saved.version }; after = record(saved)
        } else if (value.action === 'edit' || value.action === 'void') {
          const saved = await tx.moneyTransaction.findFirst({ where: { budgetId, id: value.id }, include: { entries: true } })
          if (!saved) throw new AccessError(404, 'Transaction not found')
          if (saved.voidedAt || saved.version !== value.version) throw new AccessError(409, 'This transaction changed. Refresh before trying again.')
          for (const entry of saved.entries) await account(tx, budgetId, entry.accountId)
          before = record(saved)
          if (value.action === 'void') {
            if (saved.kind === 'OPENING') throw new AccessError(400, 'Correct an opening balance by editing it, rather than voiding it')
            const updated = await tx.moneyTransaction.update({ where: { id: saved.id }, data: { voidedAt: new Date(), version: { increment: 1 } }, include: { entries: true } })
            after = record(updated); result = { id: updated.id, version: updated.version }
          } else {
            if (saved.kind !== value.kind) throw new AccessError(400, 'Keep the transaction type when editing; void and re-enter a different type')
            if (saved.kind === 'OPENING' && saved.entries[0].accountId !== value.accountId) throw new AccessError(400, 'An opening balance belongs to its original account')
            await validatePosting(tx, budgetId, value, saved.categoryId)
            await tx.moneyEntry.deleteMany({ where: { budgetId, transactionId: saved.id } })
            const updated = await tx.moneyTransaction.update({ where: { id: saved.id }, data: { date: value.date, memo: value.memo, payee: value.payee, categoryId: value.categoryId, version: { increment: 1 }, entries: { create: entries(value) } }, include: { entries: true } })
            after = record(updated); result = { id: updated.id, version: updated.version }
          }
        } else if (value.action === 'assign' || value.action === 'move') {
          if (budget.moneyRevision !== value.revision) throw new AccessError(409, 'The budget changed. Refresh before assigning money.')
          await category(tx, budgetId, value.categoryId)
          const data = await aggregates(tx, budgetId)
          const totals = monthTotals(value.month, data.assignments, data.activity, data.inflows)
          const delta = cents(value.amount, true)
          const available = totals.categories.get(value.categoryId)?.available ?? 0n
          if (value.action === 'move') {
            if (value.categoryId === value.toCategoryId) throw new AccessError(400, 'Choose two different categories')
            await category(tx, budgetId, value.toCategoryId)
            if (available < delta) throw new AccessError(400, 'The source category does not have enough available money')
          } else if ((delta > 0n && totals.readyToAssign < delta) || (delta < 0n && available < -delta)) throw new AccessError(400, 'There is not enough available money for this assignment')
          const changes = value.action === 'move' ? [[value.categoryId, -delta], [value.toCategoryId, delta]] as const : [[value.categoryId, delta]] as const
          before = record(data.assignments.filter(row => row.month === value.month))
          for (const [categoryId, change] of changes) {
            const month = calendarDate(`${value.month}-01`)
            await tx.budgetAssignment.upsert({ where: { budgetId_categoryId_month: { budgetId, categoryId, month } }, create: { budgetId, categoryId, month, amount: decimal(change) }, update: { amount: { increment: decimal(change) } } })
          }
          result = { month: value.month }; after = record({ month: value.month, changes: changes.map(([categoryId, delta]) => ({ categoryId, delta: decimal(delta) })) })
        } else if (value.action === 'account-state') {
          const saved = await tx.moneyAccount.findFirst({ where: { budgetId, id: value.id } })
          if (!saved) throw new AccessError(404, 'Account not found')
          if (saved.version !== value.version) throw new AccessError(409, 'This account changed. Refresh before trying again.')
          if (value.inactive && await balance(tx, budgetId, saved.id) !== 0n) throw new AccessError(400, 'An account must have a zero balance before it can be closed')
          before = record(saved)
          const updated = await tx.moneyAccount.update({ where: { id: saved.id }, data: { name: value.name, closedAt: value.inactive ? new Date() : null, version: { increment: 1 } } })
          after = record(updated); result = { id: updated.id, version: updated.version }
        } else {
          const saved = await tx.budgetCategory.findFirst({ where: { budgetId, id: value.id } })
          if (!saved) throw new AccessError(404, 'Category not found')
          if (saved.version !== value.version) throw new AccessError(409, 'This category changed. Refresh before trying again.')
          const groupId = value.groupId === undefined ? saved.groupId : value.groupId
          if (groupId && (!value.inactive || groupId !== saved.groupId)) await group(tx, budgetId, groupId)
          let sortOrder = saved.sortOrder
          if (groupId !== saved.groupId) {
            const last = await tx.budgetCategory.aggregate({ where: { budgetId, groupId }, _max: { sortOrder: true } })
            sortOrder = (last._max.sortOrder ?? -1) + 1
          }
          const updated = await tx.budgetCategory.update({ where: { id: saved.id }, data: { name: value.name, groupId, sortOrder, archivedAt: value.inactive ? new Date() : null, version: { increment: 1 } } })
          before = record(saved); after = record(updated); result = { id: updated.id, version: updated.version }
        }
        const revision = budget.moneyRevision + 1
        await tx.budget.update({ where: { id: budgetId }, data: { moneyRevision: revision } })
        const response = { ...(result as object), revision }
        await tx.moneyOperation.create({ data: { budgetId, actorUserId: userId, requestId, action: value.action, fingerprint, result: response, before, after } })
        if (practice) await tx.tutorialProgress.update({ where: { userId }, data: { lesson: practice.next, firstActionAt: practice.progress.firstActionAt ?? new Date(), ...(practice.next === 5 && !practice.progress.completedAt ? { completedAt: new Date() } : {}) } })
        return response
      }, { isolationLevel: 'ReadCommitted', timeout: 15_000 })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034' && attempt < 2) continue
      throw error
    }
  }
  throw new AccessError(409, 'The budget is busy. Retry this same request safely.')
}

export async function moneySnapshot(userId: string, budgetId: string, selectedMonth: string, page = 1, input: FilterInput = {}) {
  const month = budgetMonth(selectedMonth)
  const filters = moneyFilters(month, input)
  const today = todayLagos()
  if (!Number.isInteger(page) || page < 1 || page > 10000) throw new AccessError(400, 'Choose a valid transaction page')
  return prisma.$transaction(async tx => {
    const budget = await permission(tx, budgetId, userId)
    const data = await aggregates(tx, budgetId)
    const totals = monthTotals(month, data.assignments, data.activity, data.inflows)
    const start = calendarDate(`${month}-01`), end = new Date(start)
    end.setUTCMonth(end.getUTCMonth() + 1)
    const [accounts, categories, balances, transactions, activity, report, groups] = await Promise.all([
      tx.moneyAccount.findMany({ where: { budgetId }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
      tx.budgetCategory.findMany({ where: { budgetId }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }], include: { target: true } }),
      tx.moneyEntry.groupBy({ by: ['accountId'], where: { budgetId, transaction: { voidedAt: null, date: { lt: end } } }, _sum: { amount: true } }),
      tx.moneyTransaction.findMany({ where: transactionWhere(budgetId, month, filters), orderBy: [{ date: 'desc' }, { id: 'desc' }], skip: (page - 1) * 50, take: 51, include: { entries: { orderBy: { position: 'asc' }, select: { accountId: true, amount: true } } } }),
      tx.moneyOperation.findMany({ where: { budgetId }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 20, select: { id: true, action: true, actorUserId: true, createdAt: true, result: true, before: true, after: true } }),
      tx.$queryRaw<{ kind: string; amount: string }[]>`SELECT t.kind::text AS kind, SUM(e.amount)::text AS amount FROM "MoneyTransaction" t JOIN "MoneyEntry" e ON e."transactionId"=t.id AND e."budgetId"=t."budgetId" WHERE t."budgetId"=${budgetId} AND t."voidedAt" IS NULL AND t.date >= ${start} AND t.date < ${end} GROUP BY 1`,
      tx.categoryGroup.findMany({ where: { budgetId }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }], select: { id: true, name: true, note: true, version: true, archivedAt: true } }),
    ])
    const filteredReport = await tx.$queryRaw<{ kind: string; categoryId: string | null; amount: string }[]>(Prisma.sql`SELECT t.kind::text AS kind, t."categoryId", SUM(e.amount)::text AS amount FROM "MoneyTransaction" t JOIN "MoneyEntry" e ON e."transactionId"=t.id AND e."budgetId"=t."budgetId" LEFT JOIN "BudgetCategory" c ON c.id=t."categoryId" AND c."budgetId"=t."budgetId" WHERE ${reportWhere(budgetId, month, filters)} GROUP BY 1,2`)
    const filteredAmount = (kind: string) => filteredReport.filter(row => row.kind === kind).reduce((sum, row) => sum + cents(row.amount, true), 0n)
    const amountFor = (kind: string) => report.find(row => row.kind === kind)?.amount ?? '0.00'
    const rows = transactions.slice(0, 50).map(saved => ({ id: saved.id, kind: saved.kind, date: saved.date.toISOString().slice(0, 10), categoryId: saved.categoryId, memo: saved.memo, payee: saved.payee, version: saved.version, voided: !!saved.voidedAt, accountId: saved.entries[0].accountId, toAccountId: saved.entries[1]?.accountId ?? null, amount: decimal(cents(saved.entries[0].amount.toFixed(2), true) < 0n ? -cents(saved.entries[0].amount.toFixed(2), true) : cents(saved.entries[0].amount.toFixed(2), true)) }))
    const totalBalance = balances.reduce((sum, row) => sum + cents(row._sum.amount?.toFixed(2) ?? '0.00', true), 0n)
    return {
      budget: { id: budget.id, name: budget.name, role: budget.role, currency: budget.currency, revision: budget.moneyRevision, isPractice: budget.isPractice }, quickBudgetSplits: budget.quickBudgetSplits as SavedSplit[], month, today, page, filters, hasNext: transactions.length > 50,
      readyToAssign: decimal(totals.readyToAssign), futureAssigned: decimal(totals.futureAssigned), pastOverspending: decimal(totals.pastOverspending), totalBalance: decimal(totalBalance),
      accounts: accounts.map(saved => ({ id: saved.id, name: saved.name, kind: saved.kind, version: saved.version, closed: !!saved.closedAt, balance: balances.find(row => row.accountId === saved.id)?._sum.amount?.toFixed(2) ?? '0.00' })),
      groups: groups.map(saved => ({ id: saved.id, name: saved.name, note: saved.note, version: saved.version, archived: !!saved.archivedAt })),
      categories: categories.map(saved => {
        const values = totals.categories.get(saved.id)
        const assigned = decimal(values?.assigned ?? 0n), available = decimal(values?.available ?? 0n)
        const target = saved.target ? { id: saved.target.id, kind: saved.target.kind, amount: saved.target.amount.toFixed(2), startMonth: saved.target.startMonth.toISOString().slice(0, 7), dueDate: saved.target.dueDate?.toISOString().slice(0, 10) ?? null, version: saved.target.version, removed: !!saved.target.removedAt } : null
        return { id: saved.id, groupId: saved.groupId, name: saved.name, note: saved.note, version: saved.version, archived: !!saved.archivedAt, carry: decimal(values?.carry ?? 0n), assigned, activity: decimal(values?.activity ?? 0n), available, target: target ? { ...target, ...targetProgress(target, month, assigned, available, today) } : null }
      }),
      report: { opening: decimal(cents(amountFor('OPENING'), true)), income: decimal(cents(amountFor('INCOME'), true)), expenses: decimal(-cents(amountFor('EXPENSE'), true)), refunds: decimal(cents(amountFor('REFUND'), true)), netSpending: decimal(-cents(amountFor('EXPENSE'), true) - cents(amountFor('REFUND'), true)) },
      filteredReport: { opening: decimal(filteredAmount('OPENING')), income: decimal(filteredAmount('INCOME')), expenses: decimal(-filteredAmount('EXPENSE')), refunds: decimal(filteredAmount('REFUND')), netSpending: decimal(-filteredAmount('EXPENSE') - filteredAmount('REFUND')), categories: categories.map(row => ({ id: row.id, netSpending: decimal(-filteredReport.filter(item => item.categoryId === row.id && ['EXPENSE', 'REFUND'].includes(item.kind)).reduce((sum, item) => sum + cents(item.amount, true), 0n)) })) },
      transactions: rows, activity: activity.map(row => ({ ...row, createdAt: row.createdAt.toISOString() })),
    }
  }, { isolationLevel: 'RepeatableRead', timeout: 15_000 })
}

export type MoneySnapshot = Awaited<ReturnType<typeof moneySnapshot>>

export async function exportMoney(userId: string, budgetId: string, selectedMonth: string, input: FilterInput = {}) {
  const month = budgetMonth(selectedMonth)
  const filters = moneyFilters(month, input)
  return prisma.$transaction(async tx => {
    const budget = await permission(tx, budgetId, userId)
    if (budget.isPractice) throw new AccessError(403, 'Practice money stays out of financial exports.')
    const transactions = await tx.moneyTransaction.findMany({ where: transactionWhere(budgetId, month, filters), orderBy: [{ date: 'asc' }, { id: 'asc' }], take: 10001, include: { category: { select: { name: true } }, entries: { orderBy: { position: 'asc' }, include: { account: { select: { name: true } } } } } })
    if (transactions.length > 10000) throw new AccessError(413, 'This month exceeds the 10,000-record export limit')
    function cell(value: string) { return `"${(/^[\s]*[=+\-@\t\r]/.test(value) ? "'" + value : value).replaceAll('"', '""')}"` }
    const rows = transactions.map(row => [row.id, row.date.toISOString().slice(0, 10), row.kind, row.voidedAt ? 'VOIDED' : 'ACTIVE', row.entries[0].account.name, row.entries[1]?.account.name ?? '', row.category?.name ?? '', row.entries[0].amount.abs().toFixed(2), 'NGN', row.memo, row.payee])
    return [['ID', 'Date', 'Type', 'Status', 'Account', 'To account', 'Category', 'Amount', 'Currency', 'Note', 'Payee'], ...rows].map(row => row.map(cell).join(',')).join('\r\n')
  }, { isolationLevel: 'RepeatableRead', timeout: 15_000 })
}

export function csvCell(value: string) { return `"${(/^[\s]*[=+\-@\t\r]/.test(value) ? "'" + value : value).replaceAll('"', '""')}"` }

export async function exportReport(userId: string, budgetId: string, month: string, filters: FilterInput) {
  const data = await moneySnapshot(userId, budgetId, month, 1, filters), r = data.filteredReport
  if (data.budget.isPractice) throw new AccessError(403, 'Practice money stays out of financial exports.')
  const rows = [['Bimo report', data.budget.name, month, 'NGN'], ['Measure', 'Amount'], ...(['opening', 'income', 'expenses', 'refunds', 'netSpending'] as const).map(key => [key, r[key]]), [], ['Category', 'Group', 'Assigned (whole month)', 'Net spending (filtered)', 'Available (whole month)'], ...data.categories.map(row => [row.name, data.groups.find(g => g.id === row.groupId)?.name ?? 'Ungrouped', row.assigned, r.categories.find(c => c.id === row.id)!.netSpending, row.available])]
  return rows.map(row => row.map(csvCell).join(',')).join('\r\n')
}

export async function portableBudget(userId: string, budgetId: string) {
  return prisma.$transaction(async tx => {
    const budget = await permission(tx, budgetId, userId)
    if (budget.isPractice) throw new AccessError(403, 'Practice money stays out of financial exports.')
    const [accounts, categories, groups, targets, assignments, transactions] = await Promise.all([
      tx.moneyAccount.findMany({ where: { budgetId }, take: 10001 }), tx.budgetCategory.findMany({ where: { budgetId }, take: 10001 }),
      tx.categoryGroup.findMany({ where: { budgetId }, take: 10001 }), tx.categoryTarget.findMany({ where: { budgetId }, take: 10001 }),
      tx.budgetAssignment.findMany({ where: { budgetId }, take: 10001 }),
      tx.moneyTransaction.findMany({ where: { budgetId }, take: 10001, orderBy: [{ date: 'asc' }, { id: 'asc' }], include: { entries: { orderBy: { position: 'asc' } } } }),
    ])
    if ([accounts, categories, groups, targets, assignments, transactions].some(rows => rows.length > 10000)) throw new AccessError(413, 'This budget exceeds the portable export limit of 10,000 records per section. Request a larger export before relying on this file.')
    return { format: 'bimo-finances', version: 1, exportedAt: new Date().toISOString(), budget: { id: budget.id, name: budget.name, currency: budget.currency, timezone: budget.timezone }, accounts, categories, groups, targets, assignments, transactions }
  }, { isolationLevel: 'RepeatableRead', timeout: 15000 })
}
