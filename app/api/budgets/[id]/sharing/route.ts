import { verifiedSession, json, apiFailure } from '@/lib/access'
import { manageSharing, sharingSnapshot } from '@/lib/sharing'
import { consumeAccountLimit } from '@/lib/throttle'

type Context = { params: Promise<{ id: string }> }
export async function GET(request: Request, { params }: Context) {
  try { const session = await verifiedSession(request.headers); return json(await sharingSnapshot(session.user.id, (await params).id)) } catch (error) { return apiFailure(error) }
}
export async function POST(request: Request, { params }: Context) {
  try {
    if (request.headers.get('origin') !== process.env.BETTER_AUTH_URL) return json({ error: 'Request origin is not allowed' }, 403)
    const session = await verifiedSession(request.headers)
    await consumeAccountLimit('sharing-write', session.user.id, 30)
    const text = await request.text()
    if (text.length > 3000) return json({ error: 'Sharing request is too large' }, 413)
    return json(await manageSharing(session.user.id, (await params).id, JSON.parse(text)))
  } catch (error) { if (error instanceof SyntaxError) return json({ error: 'Use valid sharing details' }, 400); return apiFailure(error) }
}
