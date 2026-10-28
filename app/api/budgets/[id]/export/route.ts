import { verifiedSession, apiFailure } from '@/lib/access'
import { exportMoney } from '@/lib/money'
import { todayLagos } from '@/lib/money-math'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifiedSession(request.headers)
    const { id } = await params
    const month = new URL(request.url).searchParams.get('month') ?? todayLagos().slice(0, 7)
    const csv = await exportMoney(session.user.id, id, month)
    return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="bimo-${month}.csv"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } })
  } catch (error) { return apiFailure(error) }
}
