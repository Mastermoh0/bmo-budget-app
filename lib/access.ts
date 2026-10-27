import { auth } from './auth'
import { AccessError } from './errors'
export { AccessError } from './errors'

export async function verifiedSession(headers: Headers) {
  const session = await auth.api.getSession({ headers })
  if (!session) throw new AccessError(401, 'Sign in to continue')
  if (!session.user.emailVerified) throw new AccessError(403, 'Verify your email to continue')
  return session
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } })
}

export function apiFailure(error: unknown) {
  if (error instanceof AccessError) return json({ error: error.message }, error.status)
  return json({ error: 'The request could not be completed. Please try again.' }, 500)
}
