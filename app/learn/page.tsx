import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { tutorialProgress } from '@/lib/tutorial'
import { TutorialActions } from '@/components/tutorial-actions'
import { lessons } from '@/lib/tutorial-lessons'
import { accessibleBudgets } from '@/lib/budgets'

export default async function LearnPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/auth/signin')
  if (!session.user.emailVerified) redirect('/auth/verify')
  const [progress, budgets] = await Promise.all([tutorialProgress(session.user.id), accessibleBudgets(session.user.id)])
  const resume = Boolean(progress?.practiceBudgetId)
  return <div className="learn-welcome"><section className="learn-intro"><h1>Give your money a purpose.</h1><p>Welcome, {session.user.name}. Try a short practice budget: decide what your money is for, record a purchase, then see exactly what is left.</p><p className="muted">Four hands-on missions. Go at your own pace, skip whenever you like, and come back here to resume or replay.</p><div className="learn-safety"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 8 4v5c0 5-8 9-8 9s-8-4-8-9V7l8-4Z" /><path d="m8 12 3 3 5-6" /></svg><p>The ₦100,000 is practice money. It stays separate from your real budgets. No bank, inbox or household invitation is connected.</p></div><section className="learn-shortcuts" aria-labelledby="learn-shortcuts-title"><h2 id="learn-shortcuts-title">Useful shortcuts</h2><p className="small muted">They are optional—your missions work normally without them.</p><dl><div><dt><kbd>Ctrl / ⌘ K</kbd></dt><dd>Open Quick actions.</dd></div><div><dt><kbd>T</kbd></dt><dd>Switch between Canvas and Night Desk.</dd></div><div><dt><kbd>N</kbd></dt><dd>Open shared Notes when you are in your own budget.</dd></div></dl></section><TutorialActions version={progress?.version ?? 0} actions={[{ action: resume ? 'resume' : 'start', label: resume ? 'Resume practice' : progress?.completedAt ? 'Replay tutorial' : 'Start with practice money' }, { action: 'skip', label: budgets.length ? 'Back to my budgets' : 'Set up my own budget', secondary: true }]} />{progress?.completedAt && <p className="success">You have completed the core missions. Replay never resets a real budget.</p>}<p className="small muted">Already budgeting? <Link href="/">Return to your budgets</Link>.</p></section><section className="learn-preview" aria-label="Your practice missions"><h2>Your first small wins</h2><ol>{lessons.slice(0, 4).map((lesson, index) => <li key={lesson.title}><span className="lesson-index" aria-hidden="true">{index + 1}</span><div><h3>{lesson.title}</h3><p>{['Find where your money lives.', 'Reserve some for Food and Transport.', 'See a purchase change what is available.', 'Move money in the plan without spending it.'][index]}</p></div></li>)}</ol><p className="small muted">Then, if you want, try covering an overspending shortfall.</p></section></div>
}
