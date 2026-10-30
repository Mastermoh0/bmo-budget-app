import { verifiedSession, json, apiFailure, AccessError } from '@/lib/access'
import { prisma } from '@/lib/db'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifiedSession(request.headers)
    const { id } = await params
    const budget = await prisma.budget.findFirst({ where: { id, archivedAt: null, OR: [{ ownerUserId: session.user.id }, { members: { some: { userId: session.user.id } } }] }, include: { members: { where: { userId: session.user.id }, select: { role: true } } } })
    if (!budget) throw new AccessError(404, 'Budget is not available')
    return json({ id: budget.id, name: budget.name, currency: budget.currency, timezone: budget.timezone, role: budget.ownerUserId === session.user.id ? 'OWNER' : budget.members[0].role })
  } catch (error) { return apiFailure(error) }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (request.headers.get('origin') !== process.env.BETTER_AUTH_URL) throw new AccessError(403, 'Request origin is not allowed')
    const session = await verifiedSession(request.headers)
    const { id } = await params
    const body = await request.json().catch(() => null)
    if (!body || typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 80 || Object.keys(body).some(key => key !== 'name')) throw new AccessError(400, 'Only a valid budget name can be changed here')
    // The permission predicate is part of the update, not a role cached in the login session.
    const updated = await prisma.budget.updateMany({ where: { id, archivedAt: null, isPractice: false, OR: [{ ownerUserId: session.user.id }, { members: { some: { userId: session.user.id, role: 'EDITOR' } } }] }, data: { name: body.name.trim() } })
    if (!updated.count) throw new AccessError(403, 'You cannot change this budget')
    return json({ updated: true })
  } catch (error) { return apiFailure(error) }
}
