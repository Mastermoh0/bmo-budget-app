import { verifiedSession, json, apiFailure } from '@/lib/access'
import { applyMoney, moneySnapshot } from '@/lib/money'
import { consumeAccountLimit } from '@/lib/throttle'
import { todayLagos } from '@/lib/money-math'

type Context = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: Context) {
  try {
    const session = await verifiedSession(request.headers)
    const { id } = await context.params
    const query = new URL(request.url).searchParams
    return json(await moneySnapshot(session.user.id, id, query.get('month') ?? todayLagos().slice(0, 7), Number(query.get('page') ?? '1'), Object.fromEntries(query)))
  } catch (error) { return apiFailure(error) }
}

export async function POST(request: Request, context: Context) {
  try {
    if (request.headers.get('origin') !== process.env.BETTER_AUTH_URL) return json({ error: 'Request origin is not allowed' }, 403)
    const session = await verifiedSession(request.headers)
    await consumeAccountLimit('money-write', session.user.id, 120)
    const { id } = await context.params
    const body = await request.text()
    if (body.length > 6000) return json({ error: 'Financial request is too large' }, 413)
    let parsed: unknown
    try { parsed = JSON.parse(body) } catch { return json({ error: 'Use valid financial details' }, 400) }
    return json(await applyMoney(session.user.id, id, parsed))
  } catch (error) { return apiFailure(error) }
}
