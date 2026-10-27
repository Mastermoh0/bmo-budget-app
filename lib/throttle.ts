import { randomUUID } from 'node:crypto'
import { prisma } from './db'
import { AccessError } from './errors'

export async function consumeAccountLimit(scope: string, userId: string, max: number) {
  const now = BigInt(Date.now())
  const cutoff = now - 60000n
  const key = `bimo:${scope}:${userId}`
  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "rateLimit" ("id", "key", "count", "lastRequest") VALUES (${randomUUID()}, ${key}, 1, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "rateLimit"."lastRequest" <= ${cutoff} THEN 1 ELSE "rateLimit"."count" + 1 END,
      "lastRequest" = CASE WHEN "rateLimit"."lastRequest" <= ${cutoff} THEN ${now} ELSE "rateLimit"."lastRequest" END
    RETURNING "count"`
  if (rows[0].count > max) throw new AccessError(429, 'Too many attempts. Please wait a minute.')
}
