import { randomUUID } from 'node:crypto'
import { Prisma } from '../generated/prisma/client'
import { prisma } from './db'
import { AccessError } from './errors'
import { calendarDate, todayLagos } from './money-math'

export const tutorialProgress = (userId: string) => prisma.tutorialProgress.findUnique({ where: { userId } })

async function discardPractice(tx: Prisma.TransactionClient, userId: string, id: string) {
  await tx.$queryRaw`SELECT id FROM "Budget" WHERE id=${id} FOR UPDATE`
  const budget = await tx.budget.findFirst({ where: { id, isPractice: true, ownerUserId: userId, tutorial: { userId } } })
  if (!budget) throw new AccessError(409, 'Practice could not be reset safely. Return to Learn Bimo and try again.')
  await tx.tutorialProgress.update({ where: { userId }, data: { practiceBudgetId: null } })
  await tx.moneyEntry.deleteMany({ where: { budgetId: id } })
  await tx.moneyTransaction.deleteMany({ where: { budgetId: id } })
  await tx.budgetAssignment.deleteMany({ where: { budgetId: id } })
  await tx.moneyOperation.deleteMany({ where: { budgetId: id } })
  await tx.categoryTarget.deleteMany({ where: { budgetId: id } })
  await tx.budgetCategory.deleteMany({ where: { budgetId: id } })
  await tx.categoryGroup.deleteMany({ where: { budgetId: id } })
  await tx.moneyAccount.deleteMany({ where: { budgetId: id } })
  await tx.budget.delete({ where: { id } })
}

export async function changeTutorial(userId: string, body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new AccessError(400, 'Choose a learning action.')
  const { action, requestId, version } = body as { action?: unknown; requestId?: unknown; version?: unknown }
  if (!['start', 'resume', 'restart', 'skip', 'challenge', 'finish'].includes(action as string)) throw new AccessError(400, 'Choose a supported learning action.')
  if (typeof requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId) || !Number.isSafeInteger(version) || (version as number) < 0) throw new AccessError(400, 'Refresh Learn Bimo before trying again.')
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`tutorial:${userId}`}))`
    let progress = await tx.tutorialProgress.upsert({ where: { userId }, create: { userId }, update: {} })
    if (progress.lastRequestId === requestId) {
      if (progress.lastAction !== action) throw new AccessError(409, 'This learning request was already used for another action.')
      return { destination: progress.lastDestination! }
    }
    if (progress.version !== version) throw new AccessError(409, 'Your learning progress changed in another tab. Refresh before trying again.')
    const perform = async () => {
    if (action === 'skip') {
      await tx.tutorialProgress.update({ where: { userId }, data: { status: 'SKIPPED' } })
      return { destination: '/' }
    }
    if (action === 'finish') {
      if (!progress.practiceBudgetId || progress.lesson < 5) throw new AccessError(409, 'Finish the four core missions first, or choose Skip for now.')
      await discardPractice(tx, userId, progress.practiceBudgetId)
      await tx.tutorialProgress.update({ where: { userId }, data: { status: 'COMPLETED' } })
      return { destination: '/' }
    }
    if (action === 'challenge') {
      if (!progress.practiceBudgetId || progress.status !== 'ACTIVE' || progress.lesson !== 5) throw new AccessError(409, 'Complete the core missions before this challenge.')
      await tx.tutorialProgress.update({ where: { userId }, data: { challenge: true } })
      return { destination: '/learn/practice/transactions' }
    }
    if (action === 'restart' && progress.practiceBudgetId) {
      await discardPractice(tx, userId, progress.practiceBudgetId)
      progress = { ...progress, practiceBudgetId: null }
    }
    if (!progress.practiceBudgetId) {
      const date = calendarDate(todayLagos())
      const budget = await tx.budget.create({ data: { name: 'Practice budget · sample money', ownerUserId: userId, creatorUserId: userId, requestId: randomUUID(), creationFingerprint: 'bimo-practice-v1', isPractice: true } })
      await tx.budgetCategory.createMany({ data: [{ budgetId: budget.id, name: 'Food', sortOrder: 0 }, { budgetId: budget.id, name: 'Transport', sortOrder: 1 }] })
      await tx.tutorialProgress.update({ where: { userId }, data: { practiceBudgetId: budget.id, status: 'ACTIVE', practiceDate: date, lesson: 1, challenge: false, startedAt: progress.startedAt ?? new Date() } })
      return { destination: '/learn/practice/accounts' }
    }
    await tx.tutorialProgress.update({ where: { userId }, data: { status: 'ACTIVE' } })
    const view = progress.lesson === 1 ? '/accounts' : progress.lesson === 3 || (progress.lesson === 5 && progress.challenge) ? '/transactions' : ''
    return { destination: `/learn/practice${view}` }
    }
    const result = await perform()
    await tx.tutorialProgress.update({ where: { userId }, data: { version: { increment: 1 }, lastRequestId: requestId, lastAction: action as string, lastDestination: result.destination } })
    return result
  }, { timeout: 15000 })
}
