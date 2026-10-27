import { existsSync, writeFileSync, readFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import assert from 'node:assert/strict'
import { config, parse } from 'dotenv'
import { Client } from 'pg'

if (!existsSync('.env')) {
  const password = randomBytes(24).toString('hex')
  const base = `postgresql://bimo_dev:${password}@127.0.0.1:5433/`
  writeFileSync('.env', [
    `POSTGRES_PASSWORD=${password}`, `DATABASE_URL=${base}bimo_modern_dev`, `DATABASE_URL_UNPOOLED=${base}bimo_modern_dev`,
    'BIMO_DATABASE_TARGET=bimo_modern_dev', `SHADOW_DATABASE_URL=${base}bimo_modern_shadow`,
    'BETTER_AUTH_URL=http://localhost:3100', `BETTER_AUTH_SECRET=${randomBytes(32).toString('base64')}`,
    'MAIL_MODE=local', 'SMTP_HOST=127.0.0.1', 'SMTP_PORT=1025', 'SMTP_FROM=Bimo <bimo@example.invalid>', '',
  ].join('\n'), { flag: 'wx' })
}
const settings = parse(readFileSync('.env'))
const url = new URL(settings.DATABASE_URL_UNPOOLED)
assert.equal(url.hostname, '127.0.0.1'); assert.equal(url.port, '5433'); assert.equal(url.pathname, '/bimo_modern_dev')
assert.equal(settings.BIMO_DATABASE_TARGET, 'bimo_modern_dev')
config({ quiet: true })
function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', windowsHide: true })
  if (result.error) throw result.error
  assert.equal(result.status, 0, 'Local setup command did not complete')
}
run('docker', ['compose', '-f', 'compose.modern.yml', 'up', '-d', '--wait'])
url.pathname = '/postgres'
const admin = new Client({ connectionString: url.href, connectionTimeoutMillis: 5000 })
try {
  await admin.connect()
  for (const name of ['bimo_modern_test', 'bimo_modern_shadow']) {
    const result = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [name])
    if (!result.rowCount) await admin.query(`CREATE DATABASE "${name}"`)
  }
} finally { await admin.end() }
run(process.execPath, ['node_modules/prisma/build/index.js', 'generate'])
run(process.execPath, ['--import', 'tsx', 'scripts/check-database-target.ts'])
run(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'])
console.log('Local foundation ready. App: http://localhost:3100 · Test inbox: http://127.0.0.1:8025')
