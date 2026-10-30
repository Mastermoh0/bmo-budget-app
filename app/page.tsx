import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { NavLink as Link } from '@/components/nav-link'
import { auth } from '@/lib/auth'
import { accessibleBudgets } from '@/lib/budgets'
import { tutorialProgress } from '@/lib/tutorial'

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/auth/signin')
  if (!session.user.emailVerified) redirect('/auth/verify')
  const budgets = await accessibleBudgets(session.user.id)
  if (!budgets.length) { const progress = await tutorialProgress(session.user.id); redirect(!progress || progress.status === 'ACTIVE' ? '/learn' : '/setup') }
  return <><div className="page-heading"><div><h1>Your budgets</h1><p className="muted">Welcome, {session.user.name}. Each budget has its own access.</p></div><Link className="button" href="/setup">Create another budget</Link></div><div className="budget-directory">{budgets.map(budget => <section className="panel" key={budget.id}><div className="row spread"><h2>{budget.name}</h2><span className="status">{budget.role}</span></div><p>{budget.currency} · {budget.timezone}</p><Link className="button" href={`/budgets/${budget.id}`}>Open budget</Link></section>)}</div><aside className="notice">Accounts, category groups, savings targets, transactions and reports are available for local testing. Household invitations use the local test inbox. Gmail is not connected yet.</aside></>
}
