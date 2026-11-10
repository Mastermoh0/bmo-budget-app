import 'dotenv/config'
import assert from 'node:assert/strict'
import { Client } from 'pg'

const url = process.env.DATABASE_URL_UNPOOLED
assert(url && process.env.BIMO_DATABASE_TARGET, 'Explicit isolated database target required')
const target = decodeURIComponent(new URL(url).pathname.slice(1))
assert(target !== 'budget_app' && target === process.env.BIMO_DATABASE_TARGET, 'Refusing an unidentified or legacy target')
const client = new Client({ connectionString: url, connectionTimeoutMillis: 5000 })
try {
  await client.connect()
  const result = await client.query('SELECT current_database() AS name')
  assert.equal(result.rows[0].name, target)
  const tables = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
  if (tables.rows.length) {
    assert(tables.rows.some(row => row.tablename === '_prisma_migrations'), 'Existing unrelated tables must not be adopted')
    const migration = await client.query('SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL')
    assert(migration.rows.every(row => /^\d+_bimo_/.test(row.migration_name) || row.migration_name === '20261110010000_quick_budget'), 'Unexpected migration history')
  }
  console.log(`Validated isolated target: ${target}; public tables: ${tables.rows.length}`)
} finally { await client.end() }
