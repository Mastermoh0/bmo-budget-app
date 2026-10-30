import { createHash } from 'node:crypto'
import { prisma } from './db'
import { AccessError } from './access'

export async function accessibleBudgets(userId: string) {
  const budgets = await prisma.budget.findMany({
    where: { archivedAt: null, isPractice: false, OR: [{ ownerUserId: userId }, { members: { some: { userId } } }] },
    include: { members: { where: { userId }, select: { role: true } } }, orderBy: { createdAt: 'asc' },
  })
  return budgets.map(budget => ({ id: budget.id, name: budget.name, currency: budget.currency, timezone: budget.timezone, role: budget.ownerUserId === userId ? 'OWNER' : budget.members[0].role }))
}

export function validateBudget(body: unknown) {
  if (!body || typeof body !== 'object') throw new AccessError(400, 'Budget details are required')
  const data = body as Record<string, unknown>
  if (typeof data.name !== 'string' || !data.name.trim() || data.name.trim().length > 80) throw new AccessError(400, 'Use a budget name between 1 and 80 characters')
  if (data.currency !== 'NGN') throw new AccessError(400, 'This foundation supports NGN budgets')
  if (data.timezone !== 'Africa/Lagos') throw new AccessError(400, 'Use Africa/Lagos for this pilot')
  if (typeof data.requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.requestId)) throw new AccessError(400, 'A valid creation request is required')
  return { name: data.name.trim(), currency: 'NGN', timezone: 'Africa/Lagos', requestId: data.requestId }
}

export async function createBudget(userId: string, body: unknown) {
  const data = validateBudget(body)
  const fingerprint = createHash('sha256').update(JSON.stringify([data.name, data.currency, data.timezone])).digest('hex')
  const key = { creatorUserId_requestId: { creatorUserId: userId, requestId: data.requestId } }
  const existing = await prisma.budget.findUnique({ where: key })
  if (existing) {
    if (existing.creationFingerprint !== fingerprint) throw new AccessError(409, 'This request was already used for different budget details')
    if (existing.ownerUserId !== userId) throw new AccessError(409, 'This budget was already created and its ownership has changed. Open it through your current budget list.')
    return existing
  }
  try {
    return await prisma.$transaction(async tx => {
      const budget = await tx.budget.create({ data: { ...data, creatorUserId: userId, ownerUserId: userId, creationFingerprint: fingerprint } })
      await tx.userSettings.upsert({ where: { userId }, create: { userId, lastBudgetId: budget.id, setupCompletedAt: new Date() }, update: { lastBudgetId: budget.id, setupCompletedAt: new Date() } })
      return budget
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      const saved = await prisma.budget.findUnique({ where: key })
      if (saved?.creationFingerprint === fingerprint && saved.ownerUserId === userId) return saved
      throw new AccessError(409, 'This creation request was already used')
    }
    throw error
  }
}
