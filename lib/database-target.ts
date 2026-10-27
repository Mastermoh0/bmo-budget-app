export function assertDatabaseTarget(url: string | undefined) {
  if (!url) throw new Error('Database connection is not configured')
  const parsed = new URL(url)
  const database = decodeURIComponent(parsed.pathname.slice(1))
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol) || !process.env.BIMO_DATABASE_TARGET || database !== process.env.BIMO_DATABASE_TARGET || database === 'budget_app') {
    throw new Error('Database target does not match the isolated development target')
  }
  return url
}
