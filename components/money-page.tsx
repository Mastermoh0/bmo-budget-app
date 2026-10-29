import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { moneySnapshot } from '@/lib/money'
import { AccessError } from '@/lib/errors'
import { todayLagos } from '@/lib/money-math'
import { MoneyWorkspace, type MoneyView } from './money-workspace'
import type { FilterInput } from '@/lib/money-filters'
import { BudgetAccessGuard } from './budget-access-guard'

export type MoneyPageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ month?: string; page?: string } & FilterInput> }
export async function MoneyPage({ params, searchParams, view }: MoneyPageProps & { view: MoneyView }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/auth/signin')
  if (!session.user.emailVerified) redirect('/auth/verify')
  const [{ id }, query] = await Promise.all([params, searchParams])
  let data
  try { data = await moneySnapshot(session.user.id, id, query.month ?? todayLagos().slice(0, 7), Number(query.page ?? '1'), query) }
  catch (error) { if (error instanceof AccessError && (error.status === 404 || error.status === 400)) notFound(); throw error }
  return <BudgetAccessGuard id={id}><MoneyWorkspace key={`${id}-${data.month}`} data={data} view={view} /></BudgetAccessGuard>
}
