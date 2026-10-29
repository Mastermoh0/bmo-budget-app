import { verifiedSession, apiFailure } from '@/lib/access'
import { exportReport } from '@/lib/money'
import { todayLagos } from '@/lib/money-math'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifiedSession(request.headers), { id } = await params, query = new URL(request.url).searchParams
    const month = query.get('month') ?? todayLagos().slice(0, 7)
    const csv = await exportReport(session.user.id, id, month, Object.fromEntries(query))
    return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="bimo-report-${month}.csv"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } })
  } catch (error) { return apiFailure(error) }
}
