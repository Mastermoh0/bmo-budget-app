import { verifiedSession, json, apiFailure } from '@/lib/access'
import { accessibleBudgets, createBudget } from '@/lib/budgets'
import { consumeAccountLimit } from '@/lib/throttle'

export async function GET(request: Request) {
  try { const session = await verifiedSession(request.headers); return json(await accessibleBudgets(session.user.id)) } catch (error) { return apiFailure(error) }
}

export async function POST(request: Request) {
  try {
    if (request.headers.get('origin') !== process.env.BETTER_AUTH_URL) return json({ error: 'Request origin is not allowed' }, 403)
    const session = await verifiedSession(request.headers)
    await consumeAccountLimit('budget-create', session.user.id, 20)
    const body: unknown = await request.json().catch(() => null)
    const budget = await createBudget(session.user.id, body)
    return json({ id: budget.id, name: budget.name, currency: budget.currency, timezone: budget.timezone, role: 'OWNER' }, 201)
  } catch (error) { return apiFailure(error) }
}
