import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'
import { assertDatabaseTarget } from './database-target'

const globalDatabase = globalThis as unknown as { bimoPrisma?: PrismaClient }
export const prisma = globalDatabase.bimoPrisma ?? new PrismaClient({
  adapter: new PrismaPg({ connectionString: assertDatabaseTarget(process.env.DATABASE_URL), max: 5, connectionTimeoutMillis: 5000 }),
})
if (process.env.NODE_ENV !== 'production') globalDatabase.bimoPrisma = prisma
