import { verifiedSession, apiFailure } from '@/lib/access'
import { portableBudget } from '@/lib/money'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifiedSession(request.headers), { id } = await params
    return new Response(JSON.stringify(await portableBudget(session.user.id, id), null, 2), { headers: { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="bimo-finances.json"', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } })
  } catch (error) { return apiFailure(error) }
}
