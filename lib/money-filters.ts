import { Prisma } from '../generated/prisma/client'
import { AccessError } from './errors'
import { budgetMonth, calendarDate } from './money-math'

export type FilterInput = { q?: string; accountId?: string; categoryId?: string; groupId?: string; from?: string; to?: string; status?: string }
export function moneyFilters(month: string, input: FilterInput = {}) {
  budgetMonth(month)
  const result = { q: '', accountId: '', categoryId: '', groupId: '', from: '', to: '', status: 'all' }
  for (const key of Object.keys(result) as (keyof typeof result)[]) {
    const value = input[key]
    if (value === undefined || value === '') continue
    if (typeof value !== 'string' || value.length > 100) throw new AccessError(400, 'Use shorter filter values')
    result[key] = value.trim()
  }
  if (!['all', 'active', 'voided'].includes(result.status)) throw new AccessError(400, 'Choose active, voided or all transactions')
  for (const value of [result.from, result.to]) {
    if (value) { calendarDate(value); if (!value.startsWith(`${month}-`)) throw new AccessError(400, 'Choose dates within the selected month') }
  }
  if (result.from && result.to && result.from > result.to) throw new AccessError(400, 'The start date must precede the end date')
  return result
}
export type MoneyFilters = ReturnType<typeof moneyFilters>
export function transactionWhere(budgetId: string, month: string, f: MoneyFilters): Prisma.MoneyTransactionWhereInput {
  const start = calendarDate(`${month}-01`), end = new Date(start)
  end.setUTCMonth(end.getUTCMonth() + 1)
  return {
    budgetId, date: { gte: f.from ? calendarDate(f.from) : start, ...(f.to ? { lte: calendarDate(f.to) } : { lt: end }) },
    ...(f.accountId ? { entries: { some: { accountId: f.accountId } } } : {}),
    ...(f.categoryId ? { categoryId: f.categoryId } : {}),
    ...(f.groupId ? { category: { groupId: f.groupId === 'ungrouped' ? null : f.groupId } } : {}),
    ...(f.status === 'active' ? { voidedAt: null } : f.status === 'voided' ? { voidedAt: { not: null } } : {}),
    ...(f.q ? { OR: [{ payee: { contains: f.q.replace(/[\\%_]/g, '\\$&'), mode: 'insensitive' } }, { memo: { contains: f.q.replace(/[\\%_]/g, '\\$&'), mode: 'insensitive' } }] } : {}),
  }
}

// Report predicates match transaction filters, but always exclude voided money.
export function reportWhere(budgetId: string, month: string, f: MoneyFilters) {
  const start = calendarDate(`${month}-01`), end = new Date(start)
  end.setUTCMonth(end.getUTCMonth() + 1)
  const clauses = [Prisma.sql`t."budgetId"=${budgetId}`, Prisma.sql`t."voidedAt" IS NULL`, Prisma.sql`t.date >= ${f.from ? calendarDate(f.from) : start}`, f.to ? Prisma.sql`t.date <= ${calendarDate(f.to)}` : Prisma.sql`t.date < ${end}`]
  if (f.accountId) clauses.push(Prisma.sql`e."accountId"=${f.accountId}`)
  if (f.categoryId) clauses.push(Prisma.sql`t."categoryId"=${f.categoryId}`)
  if (f.groupId) clauses.push(f.groupId === 'ungrouped' ? Prisma.sql`c."groupId" IS NULL AND t."categoryId" IS NOT NULL` : Prisma.sql`c."groupId"=${f.groupId}`)
  if (f.q) clauses.push(Prisma.sql`(strpos(lower(t.payee), lower(${f.q})) > 0 OR strpos(lower(t.memo), lower(${f.q})) > 0)`)
  return Prisma.join(clauses, ' AND ')
}

export function filterParams(f: MoneyFilters) {
  return Object.fromEntries(Object.entries(f).filter(([, value]) => value && value !== 'all'))
}
