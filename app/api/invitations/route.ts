import { verifiedSession, json, apiFailure } from '@/lib/access'
import { processInvitation } from '@/lib/sharing'
import { consumeAccountLimit } from '@/lib/throttle'

export async function POST(request: Request) {
  try {
    if (request.headers.get('origin') !== process.env.BETTER_AUTH_URL) return json({ error: 'Request origin is not allowed' }, 403)
    const session = await verifiedSession(request.headers)
    await consumeAccountLimit('invitation-use', session.user.id, 30)
    const text = await request.text()
    if (text.length > 1000) return json({ error: 'Invitation request is too large' }, 413)
    return json(await processInvitation(session.user.id, JSON.parse(text)))
  } catch (error) { if (error instanceof SyntaxError) return json({ error: 'Use valid invitation details' }, 400); return apiFailure(error) }
}
