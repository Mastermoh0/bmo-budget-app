import { headers } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { accessibleBudgets } from '@/lib/budgets'

export default async function BudgetPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/auth/signin')
  if (!session.user.emailVerified) redirect('/auth/verify')
  const { id } = await params
  const budget = (await accessibleBudgets(session.user.id)).find(budget => budget.id === id)
  if (!budget) notFound()
  return <section className="panel"><span className="status">{budget.role}</span><h1>{budget.name}</h1><p>{budget.currency} · {budget.timezone}</p><div className="notice"><strong>No financial records yet.</strong><p>Accounts, categories and transactions will be added with the corrected money engine. This preview cannot post expenses or import email alerts.</p></div></section>
}
