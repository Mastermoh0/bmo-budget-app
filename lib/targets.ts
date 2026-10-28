import { cents, decimal } from './money-math'

type Target = { kind: 'MONTHLY' | 'BY_DATE'; amount: string; startMonth: string; dueDate: string | null }

export function targetProgress(target: Target, month: string, assigned: string, available: string, today: string) {
  const goal = cents(target.amount)
  const started = month >= target.startMonth
  const raw = started ? cents(target.kind === 'MONTHLY' ? assigned : available, true) : 0n
  const saved = raw > 0n ? raw : 0n
  const remaining = raw < goal ? goal - raw : 0n
  const complete = started && remaining === 0n
  const dueMonth = target.dueDate?.slice(0, 7) ?? null
  const overdue = started && !complete && !!target.dueDate && (month > dueMonth! || (month === today.slice(0, 7) && today > target.dueDate))
  let monthsLeft = 1
  if (dueMonth && dueMonth >= month) {
    const [dueYear, dueNumber] = dueMonth.split('-').map(Number), [year, number] = month.split('-').map(Number)
    monthsLeft = (dueYear - year) * 12 + dueNumber - number + 1
  }
  const suggested = !started ? 0n : target.kind === 'MONTHLY' ? remaining : (remaining + BigInt(monthsLeft) - 1n) / BigInt(monthsLeft)
  return { saved: decimal(saved), remaining: decimal(remaining), shortfall: decimal(raw < 0n ? -raw : 0n), suggested: decimal(suggested), percent: goal === 0n ? 0 : Number((saved > goal ? goal : saved) * 100n / goal), status: !started ? 'NOT_STARTED' : complete ? 'COMPLETE' : overdue ? 'OVERDUE' : 'IN_PROGRESS', monthsLeft }
}
