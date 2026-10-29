import { createHash, randomBytes } from 'node:crypto'
import { Prisma } from '../generated/prisma/client'
import { prisma } from './db'
import { AccessError } from './errors'
import { sendLocalMail } from './mail'

const hash = (value: string) => createHash('sha256').update(value).digest('hex')
const uuid = (value: unknown) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
const jsonRecord = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value))

async function access(tx: Prisma.TransactionClient, budgetId: string, userId: string) {
  const budget = await tx.budget.findFirst({ where: { id: budgetId, archivedAt: null }, include: { members: { where: { userId } } } })
  if (!budget || (budget.ownerUserId !== userId && !budget.members.length)) throw new AccessError(404, 'Budget not available')
  return { ...budget, role: budget.ownerUserId === userId ? 'OWNER' : budget.members[0].role }
}

export async function sharingSnapshot(userId: string, budgetId: string) {
  return prisma.$transaction(async tx => {
    const budget = await access(tx, budgetId, userId), owner = budget.role === 'OWNER'
    const [members, invitations, ownerUser] = await Promise.all([
      tx.budgetMember.findMany({ where: { budgetId }, orderBy: { joinedAt: 'asc' }, select: { userId: true, role: true, version: true, user: { select: { name: true, email: true } } } }),
      owner ? tx.budgetInvitation.findMany({ where: { budgetId }, orderBy: { createdAt: 'desc' }, take: 50, select: { id: true, email: true, role: true, ownership: true, expiresAt: true, acceptedAt: true, revokedAt: true, delivery: true } }) : [],
      tx.user.findUniqueOrThrow({ where: { id: budget.ownerUserId }, select: { name: true, email: true } }),
    ])
    return { budget: { id: budget.id, name: budget.name, role: budget.role, revision: budget.sharingRevision }, userId, owner: { id: budget.ownerUserId, name: ownerUser.name }, members: members.map(row => ({ id: row.userId, name: row.user.name, email: owner ? row.user.email : null, role: row.role, version: row.version })), invitations: invitations.map(row => ({ ...row, expiresAt: row.expiresAt.toISOString(), status: row.revokedAt ? 'REVOKED' : row.acceptedAt ? 'ACCEPTED' : row.expiresAt <= new Date() ? 'EXPIRED' : 'PENDING', revokedAt: undefined, acceptedAt: undefined })) }
  }, { isolationLevel: 'RepeatableRead' })
}
export type SharingSnapshot = Awaited<ReturnType<typeof sharingSnapshot>>

export async function manageSharing(userId: string, budgetId: string, body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new AccessError(400, 'Sharing details are required')
  const data = body as Record<string, unknown>
  if (!uuid(data.requestId) || !Number.isSafeInteger(data.revision) || (data.revision as number) < 0) throw new AccessError(400, 'Refresh and use a valid sharing request')
  if (!['invite', 'offer-ownership', 'revoke', 'role', 'remove', 'leave'].includes(data.action as string)) throw new AccessError(400, 'Choose a supported sharing action')
  const action = data.action as string, requestId = data.requestId as string, fingerprint = hash(JSON.stringify(data))
  let mail: { id: string; email: string; token: string; ownership: boolean } | undefined
  const result = await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "Budget" WHERE id=${budgetId} FOR UPDATE`
    const budget = await access(tx, budgetId, userId)
    if (action !== 'leave' && budget.role !== 'OWNER') throw new AccessError(403, 'Only the owner can manage household access')
    if (action === 'leave' && budget.role === 'OWNER') throw new AccessError(400, 'Have another editor accept ownership before you leave')
    const existing = await tx.moneyOperation.findUnique({ where: { budgetId_requestId: { budgetId, requestId } } })
    if (existing) {
      if (existing.actorUserId !== userId || existing.fingerprint !== fingerprint) throw new AccessError(409, 'This request was already used for other details')
      return existing.result
    }
    if (budget.sharingRevision !== data.revision) throw new AccessError(409, 'Household access changed. Refresh before saving.')
    let before: unknown, after: unknown, response: Record<string, unknown> = { updated: true }
    if (action === 'invite' || action === 'offer-ownership') {
      if (typeof data.email !== 'string' || data.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw new AccessError(400, 'Use a valid email address')
      const email = data.email.trim().toLowerCase(), ownership = action === 'offer-ownership'
      if (!ownership && !['EDITOR', 'VIEWER'].includes(data.role as string)) throw new AccessError(400, 'Choose editor or viewer access')
      const recipient = await tx.user.findUnique({ where: { email } })
      if (recipient?.id === budget.ownerUserId) throw new AccessError(400, 'The owner already has access')
      const member = recipient ? await tx.budgetMember.findUnique({ where: { budgetId_userId: { budgetId, userId: recipient.id } } }) : null
      if (ownership && (!member || member.role !== 'EDITOR')) throw new AccessError(400, 'Offer ownership to an existing editor')
      if (!ownership && member) throw new AccessError(400, 'This person is already a member. Change their role instead.')
      if (await tx.budgetInvitation.count({ where: { budgetId, revokedAt: null, acceptedAt: null, expiresAt: { gt: new Date() } } }) >= 50) throw new AccessError(400, 'Revoke unused invitations before creating more (50 pending maximum)')
      await tx.budgetInvitation.updateMany({ where: { budgetId, email, ownership, revokedAt: null, acceptedAt: null }, data: { revokedAt: new Date() } })
      const token = randomBytes(32).toString('base64url')
      const saved = await tx.budgetInvitation.create({ data: { budgetId, email, role: ownership ? 'EDITOR' : data.role as 'EDITOR' | 'VIEWER', ownership, tokenHash: hash(token), createdById: userId, expiresAt: new Date(Date.now() + 7 * 86400000) } })
      mail = { id: saved.id, email, token, ownership }
      after = { invitationId: saved.id, role: saved.role, ownership, expiresAt: saved.expiresAt }; response = { invitationId: saved.id }
    } else if (action === 'revoke') {
      if (typeof data.id !== 'string') throw new AccessError(400, 'Choose an invitation')
      const invite = await tx.budgetInvitation.findFirst({ where: { id: data.id, budgetId, revokedAt: null, acceptedAt: null } })
      if (!invite) throw new AccessError(404, 'Pending invitation not found')
      await tx.budgetInvitation.update({ where: { id: invite.id }, data: { revokedAt: new Date() } }); after = { invitationId: invite.id, revoked: true }
    } else {
      const targetId = action === 'leave' ? userId : data.userId
      if (typeof targetId !== 'string' || targetId === budget.ownerUserId) throw new AccessError(400, 'The owner cannot be removed or demoted')
      const key = { budgetId_userId: { budgetId, userId: targetId } }, member = await tx.budgetMember.findUnique({ where: key })
      if (!member) throw new AccessError(404, 'Member not found')
      if (action !== 'leave' && member.version !== data.version) throw new AccessError(409, 'This member changed. Refresh before saving.')
      before = { userId: member.userId, role: member.role }
      if (action === 'role') {
        if (!['EDITOR', 'VIEWER'].includes(data.role as string)) throw new AccessError(400, 'Choose editor or viewer access')
        await tx.budgetMember.update({ where: key, data: { role: data.role as 'EDITOR' | 'VIEWER', version: { increment: 1 } } }); after = { userId: targetId, role: data.role }
      } else {
        await tx.budgetMember.delete({ where: key }); after = { userId: targetId, removed: true }
        const user = await tx.user.findUniqueOrThrow({ where: { id: targetId }, select: { email: true } })
        await tx.budgetInvitation.updateMany({ where: { budgetId, email: user.email, acceptedAt: null, revokedAt: null }, data: { revokedAt: new Date() } })
      }
    }
    await tx.budget.update({ where: { id: budgetId }, data: { sharingRevision: { increment: 1 } } })
    await tx.moneyOperation.create({ data: { budgetId, actorUserId: userId, requestId, action: `sharing-${action}`, fingerprint, result: jsonRecord(response), ...(before ? { before: jsonRecord(before) } : {}), ...(after ? { after: jsonRecord(after) } : {}) } })
    return response
  }, { isolationLevel: 'ReadCommitted', timeout: 15000 })
  if (mail) {
    const message = mail
    try {
      await sendLocalMail(message.email, message.ownership ? 'Bimo ownership offer' : 'Bimo household invitation', `You have an optional ${message.ownership ? 'budget ownership offer' : 'household invitation'}. Sign in with this email address and review what you are accepting. This link expires in seven days.\n\n${process.env.BETTER_AUTH_URL}/invitations#${message.token}\n\nIgnore this message if you did not expect it.`)
      await prisma.budgetInvitation.update({ where: { id: message.id }, data: { delivery: 'SENT' } })
    } catch {
      // shortcut: interrupted/failed invitation delivery needs a new invitation; never persist a raw bearer token.
      await prisma.budgetInvitation.update({ where: { id: message.id }, data: { delivery: 'FAILED' } })
    }
  }
  return result
}

export async function processInvitation(userId: string, body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new AccessError(400, 'Invitation details are required')
  const data = body as Record<string, unknown>
  if (typeof data.token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(data.token) || !['preview', 'accept'].includes(data.action as string)) throw new AccessError(400, 'Use a complete invitation link')
  if (data.action === 'accept' && !uuid(data.requestId)) throw new AccessError(400, 'Use a valid acceptance request')
  const found = await prisma.budgetInvitation.findUnique({ where: { tokenHash: hash(data.token) }, select: { budgetId: true } })
  if (!found) throw new AccessError(404, 'Invitation not available')
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "Budget" WHERE id=${found.budgetId} FOR UPDATE`
    const invitation = await tx.budgetInvitation.findUniqueOrThrow({ where: { tokenHash: hash(data.token as string) } })
    const budget = await tx.budget.findUniqueOrThrow({ where: { id: invitation.budgetId } })
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } })
    if (!user.emailVerified || user.email.toLowerCase() !== invitation.email) throw new AccessError(403, 'Sign in with the verified email address that received this invitation')
    const membership = await tx.budgetMember.findUnique({ where: { budgetId_userId: { budgetId: budget.id, userId } } })
    if (data.action === 'accept') {
      const previous = await tx.moneyOperation.findUnique({ where: { budgetId_requestId: { budgetId: budget.id, requestId: data.requestId as string } } })
      if (previous && (previous.actorUserId !== userId || previous.fingerprint !== hash(invitation.id))) throw new AccessError(409, 'This acceptance request was already used for other details')
    }
    if (invitation.acceptedAt) {
      if (invitation.acceptedUserId === userId && (membership || budget.ownerUserId === userId)) return { budgetId: budget.id, accepted: true }
      throw new AccessError(410, 'This invitation has already been used')
    }
    if (invitation.revokedAt || invitation.expiresAt <= new Date() || budget.archivedAt || budget.ownerUserId !== invitation.createdById) throw new AccessError(410, 'This invitation expired or was revoked')
    if (data.action === 'preview') return { budgetId: budget.id, name: budget.name, role: invitation.ownership ? 'OWNER' : invitation.role, ownership: invitation.ownership, accepted: false }
    let before: unknown = { ownerUserId: budget.ownerUserId }
    if (invitation.ownership) {
      if (!membership || membership.role !== 'EDITOR') throw new AccessError(403, 'Only the invited current editor can accept ownership')
      await tx.budget.update({ where: { id: budget.id }, data: { ownerUserId: userId } })
      await tx.budgetMember.delete({ where: { id: membership.id } })
      await tx.budgetMember.upsert({ where: { budgetId_userId: { budgetId: budget.id, userId: budget.ownerUserId } }, create: { budgetId: budget.id, userId: budget.ownerUserId, role: 'EDITOR' }, update: { role: 'EDITOR', version: { increment: 1 } } })
      await tx.budgetInvitation.updateMany({ where: { budgetId: budget.id, acceptedAt: null, revokedAt: null, id: { not: invitation.id } }, data: { revokedAt: new Date() } })
    } else {
      if (membership || budget.ownerUserId === userId) throw new AccessError(409, 'You already belong to this budget')
      before = { member: false }
      await tx.budgetMember.create({ data: { budgetId: budget.id, userId, role: invitation.role } })
    }
    await tx.budgetInvitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date(), acceptedUserId: userId } })
    await tx.budget.update({ where: { id: budget.id }, data: { sharingRevision: { increment: 1 } } })
    const result = { budgetId: budget.id, accepted: true }
    await tx.moneyOperation.create({ data: { budgetId: budget.id, actorUserId: userId, requestId: data.requestId as string, action: invitation.ownership ? 'sharing-accept-owner' : 'sharing-accept', fingerprint: hash(invitation.id), result, before: jsonRecord(before), after: { userId, role: invitation.ownership ? 'OWNER' : invitation.role, invitationId: invitation.id } } })
    return result
  }, { isolationLevel: 'ReadCommitted', timeout: 15000 })
}
