import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { tutorialProgress } from '@/lib/tutorial'
import { moneySnapshot } from '@/lib/money'
import { AccessError } from '@/lib/errors'
import { MoneyWorkspace, type MoneyView } from './money-workspace'
import { TutorialGuide } from './tutorial-guide'

export async function PracticePage({ view }: { view: MoneyView }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/auth/signin')
  if (!session.user.emailVerified) redirect('/auth/verify')
  const progress = await tutorialProgress(session.user.id)
  if (!progress?.practiceBudgetId || !progress.practiceDate || progress.status !== 'ACTIVE') redirect('/learn')
  const date = progress.practiceDate.toISOString().slice(0, 10)
  let data
  try { data = await moneySnapshot(session.user.id, progress.practiceBudgetId, date.slice(0, 7)) }
  catch (error) { if (error instanceof AccessError && error.status === 404) redirect('/learn'); throw error }
  data.today = date
  const lesson = progress.lesson === 5 && !progress.challenge ? 0 : progress.lesson
  return <div className="practice-layout"><TutorialGuide progress={{ lesson: progress.lesson, challenge: progress.challenge, version: progress.version, date }} data={data} /><div id="practice-workspace" className="practice-workspace" tabIndex={-1}><MoneyWorkspace data={data} view={view} practiceLesson={lesson} /></div></div>
}
