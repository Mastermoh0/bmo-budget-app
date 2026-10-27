import 'dotenv/config'
import { deliverWelcome } from '../lib/mail'
import { prisma } from '../lib/db'

try {
  // A terminated sender is ambiguous; retain SENDING for review rather than risk a duplicate welcome.
  await deliverWelcome()
  await prisma.rateLimit.deleteMany({ where: { lastRequest: { lt: BigInt(Date.now() - 86400000) } } })
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } })
} finally { await prisma.$disconnect() }
