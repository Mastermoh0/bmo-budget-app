import { verifiedSession, json, apiFailure, AccessError } from '@/lib/access'
import { changeTutorial } from '@/lib/tutorial'
import { consumeAccountLimit } from '@/lib/throttle'

export async function POST(request: Request) {
  try {
    if (request.headers.get('origin') !== process.env.BETTER_AUTH_URL) throw new AccessError(403, 'Request origin is not allowed')
    const session = await verifiedSession(request.headers)
    await consumeAccountLimit('tutorial', session.user.id, 30)
    const body = await request.text()
    if (body.length > 200) throw new AccessError(413, 'Learning request is too large')
    let parsed: unknown
    try { parsed = JSON.parse(body) } catch { throw new AccessError(400, 'Choose a learning action.') }
    return json(await changeTutorial(session.user.id, parsed))
  } catch (error) { return apiFailure(error) }
}
