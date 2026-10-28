import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { accessibleBudgets } from '@/lib/budgets'

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/auth/signin')
  if (!session.user.emailVerified) redirect('/auth/verify')
  const budgets = await accessibleBudgets(session.user.id)
  if (!budgets.length) redirect('/setup')
  return <><div className="row spread"><div><h1>Your budgets</h1><p className="muted">Welcome, {session.user.name}. Each budget has its own access.</p></div><Link className="button" href="/setup">Create another budget</Link></div>{budgets.map(budget => <section className="panel" key={budget.id}><div className="row spread"><h2>{budget.name}</h2><span className="status">{budget.role}</span></div><p>{budget.currency} · {budget.timezone}</p><Link href={`/budgets/${budget.id}`}>Open budget</Link></section>)}<aside className="notice">Accounts, category groups, savings targets, transactions and reports are available for local testing. Household invitations and Gmail are not connected yet.</aside></>
}
