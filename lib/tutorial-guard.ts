import type { Prisma } from '../generated/prisma/client'
import type { Command } from './money'
import { AccessError } from './errors'

// This runs under the money engine's budget lock, before any practice mutation.
export async function practiceCommand(tx: Prisma.TransactionClient, budgetId: string, userId: string, value: Command) {
  const progress = await tx.tutorialProgress.findUnique({ where: { practiceBudgetId: budgetId } })
  if (!progress || progress.userId !== userId || progress.status !== 'ACTIVE' || !progress.practiceDate) throw new AccessError(409, 'Resume your practice from Learn Bimo before making this change.')
  const [categories, accounts, assignments] = await Promise.all([
    tx.budgetCategory.findMany({ where: { budgetId } }), tx.moneyAccount.findMany({ where: { budgetId } }), tx.budgetAssignment.findMany({ where: { budgetId } }),
  ])
  const food = categories.find(row => row.name === 'Food')!, transport = categories.find(row => row.name === 'Transport')!
  const date = progress.practiceDate.toISOString().slice(0, 10), month = date.slice(0, 7), lesson = progress.lesson
  const wrong = () => { throw new AccessError(400, 'Use the practice amounts and choices in your current mission. Your real budgets are unchanged.') }
  let next = lesson
  if (lesson === 1 && value.action === 'account') {
    if (accounts.length || value.name !== 'Practice wallet' || value.kind !== 'BANK' || value.amount !== '100000.00' || value.date.toISOString().slice(0, 10) !== date) wrong()
    next = 2
  } else if (lesson === 2 && value.action === 'assign') {
    const expected = value.categoryId === food.id ? '20000.00' : value.categoryId === transport.id ? '10000.00' : null
    if (!expected || value.amount !== expected || value.month !== month || assignments.some(row => row.categoryId === value.categoryId)) wrong()
    next = assignments.length === 1 ? 3 : 2
  } else if ((lesson === 3 || (lesson === 5 && progress.challenge)) && value.action === 'post') {
    if (value.kind !== 'EXPENSE' || value.accountId !== accounts[0]?.id || value.categoryId !== food.id || value.amount !== (lesson === 3 ? '2000.00' : '26000.00') || value.date.toISOString().slice(0, 10) !== date) wrong()
    next = lesson + 1
  } else if ((lesson === 4 || lesson === 6) && value.action === 'move') {
    if (value.categoryId !== transport.id || value.toCategoryId !== food.id || value.amount !== (lesson === 4 ? '5000.00' : '3000.00') || value.month !== month) wrong()
    next = lesson + 1
  } else wrong()
  return { progress, next }
}
