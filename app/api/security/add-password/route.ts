import { auth } from '@/lib/auth'
import { verifiedSession, json, apiFailure, AccessError } from '@/lib/access'
import { consumeAccountLimit } from '@/lib/throttle'

export async function POST(request: Request) {
  try {
    if (request.headers.get('origin') !== process.env.BETTER_AUTH_URL) throw new AccessError(403, 'Request origin is not allowed')
    const session = await verifiedSession(request.headers)
    if (Date.now() - new Date(session.session.createdAt).getTime() > 15 * 60000) throw new AccessError(403, 'Sign in again before adding a password')
    await consumeAccountLimit('add-password', session.user.id, 3)
    const body = await request.json().catch(() => null)
    if (!body || typeof body.newPassword !== 'string' || body.newPassword.length < 12 || body.newPassword.length > 128) throw new AccessError(400, 'Use a password between 12 and 128 characters')
    await auth.api.setPassword({ headers: request.headers, body: { newPassword: body.newPassword } })
    return json({ updated: true })
  } catch (error) { return apiFailure(error) }
}
