'use client'
import { useEffect, useRef, useState } from 'react'
import { NavLink as Link } from './nav-link'
import { TutorialActions } from './tutorial-actions'
import { lessons, practicePath } from '@/lib/tutorial-lessons'
import type { MoneySnapshot } from '@/lib/money'

export type PracticeProgress = { lesson: number; challenge: boolean; version: number; date: string }
export function TutorialGuide({ progress, data }: { progress: PracticeProgress; data: MoneySnapshot }) {
  const [review, setReview] = useState<number | null>(null), heading = useRef<HTMLHeadingElement>(null)
  const count = progress.challenge ? 6 : 4, complete = progress.lesson > count, done = Math.min(progress.lesson - 1, count)
  const shown = review ?? Math.min(progress.lesson, count), lesson = lessons[shown - 1]
  useEffect(() => { heading.current?.focus({ preventScroll: true }) }, [progress.lesson])
  return <aside className="tutorial-guide" aria-label="Practice guide">
    <div className="row spread"><h2>Learning missions</h2><span className="status">Practice only</span></div>
    <p className="small muted">Sample money, private to you. Your real budgets are untouched.</p>
    <progress value={done} max={count} aria-label="Practice missions completed" />
    <p className="small" role="status">{done} of {count} missions complete</p>
    <ol className="mission-list">{lessons.slice(0, count).map((item, index) => <li key={item.title}><button type="button" className="secondary" aria-current={shown === index + 1 ? 'step' : undefined} disabled={index + 1 > progress.lesson} onClick={() => setReview(index + 1 < progress.lesson ? index + 1 : null)}><span className="mission-number" aria-hidden="true">{index + 1 < progress.lesson ? <svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg> : index + 1}</span><span>{item.title}{index + 1 < progress.lesson && <small>Completed</small>}</span></button></li>)}</ol>
    <section className="mission-instruction" aria-labelledby="mission-title">
      <h2 id="mission-title" ref={heading} tabIndex={-1}>{complete && !review ? 'You can make a plan.' : lesson.title}</h2>
      {complete && !review ? <><p>You gave money a purpose, recorded spending and adjusted your plan. You are ready to use your own numbers.</p><p className="small muted">Finishing removes this sample budget. It never copies practice money into a real budget.</p></> : review ? <><p>{lesson.result}</p><p className="small muted">You are reviewing a completed mission. The workspace shows your current practice balances.</p></> : <>
        {progress.lesson > 1 && <p className="mission-feedback">{lessons[progress.lesson - 2].result}</p>}
        <p>{lesson.instruction}</p><p className="small muted">Use the practice date {progress.date}. A mission completes only after its change saves.</p>
        {progress.lesson === 2 && <ul className="small allocation-checks">{data.categories.map(row => <li key={row.id}>{row.name}: {row.assigned === (row.name === 'Food' ? '20000.00' : '10000.00') ? 'assigned correctly' : 'still to assign'}</li>)}</ul>}
        <Link className="button" href={`${practicePath(lesson.view)}#practice-workspace`}>Open {lesson.view[0].toUpperCase() + lesson.view.slice(1)}</Link>
      </>}
      <div className="row review-controls">{shown > 1 && <button type="button" className="secondary" onClick={() => setReview(complete && !review ? count : shown - 1)}>Back</button>}{review && <button type="button" className="secondary" onClick={() => setReview(shown + 1 >= progress.lesson ? null : shown + 1)}>{shown + 1 >= progress.lesson ? complete ? 'Back to finish' : 'Return to current mission' : 'Next review'}</button>}</div>
    </section>
    <TutorialActions version={progress.version} actions={complete && !review ? [{ action: 'finish', label: 'Use my own money' }, ...(!progress.challenge ? [{ action: 'challenge' as const, label: 'Try the overspending challenge', secondary: true }] : []), { action: 'restart', label: 'Replay from the beginning', secondary: true }] : [{ action: 'skip', label: 'Skip for now', secondary: true }, { action: 'restart', label: 'Start practice over', secondary: true }]} />
    <p className="small muted">Skipping saves your place. Start over resets only these sample records. You can resume or replay from Learn Bimo.</p>
  </aside>
}
