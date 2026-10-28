import 'dotenv/config'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { existsSync } from 'node:fs'

assert(existsSync('.next/BUILD_ID'), 'Run npm run build before integration tests')
const url = new URL(process.env.DATABASE_URL)
assert(['localhost', '127.0.0.1'].includes(url.hostname), 'Integration tests require local PostgreSQL')
url.pathname = '/bimo_modern_test'
const env = { ...process.env, DATABASE_URL: url.href, DATABASE_URL_UNPOOLED: url.href, BIMO_DATABASE_TARGET: 'bimo_modern_test' }
function command(args, environment = env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { env: environment, stdio: 'inherit', windowsHide: true })
    child.on('error', reject)
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Child check exited ${code}`)))
  })
}
await command(['--import', 'tsx', 'scripts/check-database-target.ts'])
await command(['node_modules/prisma/build/index.js', 'migrate', 'deploy'])
await command(['node_modules/prisma/build/index.js', 'migrate', 'deploy'])
const servers = [3110, 3111].map(port => spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port), '--hostname', '127.0.0.1'], { env: { ...env, BETTER_AUTH_URL: `http://127.0.0.1:${port}` }, stdio: ['ignore', 'ignore', 'inherit'], windowsHide: true }))
try {
  for (const port of [3110, 3111]) {
    let ready = false
    for (let attempt = 0; attempt < 100; attempt++) {
      try { const response = await fetch(`http://127.0.0.1:${port}/api/auth/ok`); if (response.ok) { ready = true; break } } catch { /* Wait for this owned local test process. */ }
      await delay(200)
    }
    assert(ready, 'Local test server did not become ready')
  }
  await command(['--import', 'tsx', '--test', '--test-concurrency=1', 'tests/foundation.test.ts', 'tests/money.test.ts', 'tests/targets.test.ts'], { ...env, BETTER_AUTH_URL: 'http://127.0.0.1:3110', TEST_SECOND_ORIGIN: 'http://127.0.0.1:3111' })
} finally {
  for (const server of servers) server.kill()
}
