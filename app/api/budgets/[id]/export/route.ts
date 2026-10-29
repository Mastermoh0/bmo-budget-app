import { verifiedSession, apiFailure } from '@/lib/access'
import { exportMoney } from '@/lib/money'
import { todayLagos } from '@/lib/money-math'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifiedSession(request.headers)
    const { id } = await params
    const query = new URL(request.url).searchParams
    const month = query.get('month') ?? todayLagos().slice(0, 7)
    const csv = await exportMoney(session.user.id, id, month, Object.fromEntries(query))
    return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="bimo-${month}.csv"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } })
  } catch (error) { return apiFailure(error) }
}
