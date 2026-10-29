import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { BudgetSetup } from '@/components/budget-setup'

export default async function SetupPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/auth/signin')
  if (!session.user.emailVerified) redirect('/auth/verify')
  return <section className="panel auth"><h1>Your first private budget</h1><p>Signed in as {session.user.name}. Give this budget a name. You can create another independent budget later.</p><BudgetSetup /><p className="muted small">No demo money or old records will be added. Next, add your accounts and categories inside the budget.</p></section>
}
