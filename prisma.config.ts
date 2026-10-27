import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'
import { assertDatabaseTarget } from './lib/database-target'

const shadow = process.env.SHADOW_DATABASE_URL
if (shadow && decodeURIComponent(new URL(shadow).pathname.slice(1)) !== 'bimo_modern_shadow') throw new Error('Only the explicitly reserved shadow database can be used')

export default defineConfig({
  schema: 'prisma/modern/schema.prisma',
  migrations: { path: 'prisma/modern/migrations' },
  datasource: { url: assertDatabaseTarget(env('DATABASE_URL_UNPOOLED')), shadowDatabaseUrl: shadow },
})
