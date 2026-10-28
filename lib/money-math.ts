import { AccessError } from './errors'

export function cents(value: unknown, signed = false): bigint {
  if (typeof value !== 'string' || !(signed ? /^-?(0|[1-9]\d*)(\.\d{1,2})?$/ : /^(0|[1-9]\d*)(\.\d{1,2})?$/).test(value)) throw new AccessError(400, 'Use a plain amount with at most two decimal places')
  const negative = value.startsWith('-')
  const [whole, fraction = ''] = value.replace('-', '').split('.')
  const result = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'))
  return negative ? -result : result
}

export function decimal(value: bigint) {
  const absolute = value < 0n ? -value : value
  return `${value < 0n ? '-' : ''}${absolute / 100n}.${String(absolute % 100n).padStart(2, '0')}`
}

export function calendarDate(value: unknown) {
  if (typeof value !== 'string' || !/^(19|20|21)\d{2}-\d{2}-\d{2}$/.test(value)) throw new AccessError(400, 'Use a calendar date between 1900 and 2199')
  const date = new Date(`${value}T00:00:00.000Z`)
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new AccessError(400, 'Use a valid calendar date')
  return date
}

export function budgetMonth(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}$/.test(value)) throw new AccessError(400, 'Use a budget month such as 2026-10')
  calendarDate(`${value}-01`)
  return value
}

export function todayLagos() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()) }

export type MonthlyAmount = { month: string; categoryId: string; amount: string }

// Rollover is a calculation over monthly totals, never a second set of money records.
export function monthTotals(month: string, assignments: MonthlyAmount[], activity: MonthlyAmount[], inflows: { month: string; amount: string }[]) {
  const byMonth = new Map<string, Map<string, { assigned: bigint; activity: bigint }>>()
  for (const [rows, key] of [[assignments, 'assigned'], [activity, 'activity']] as const) {
    for (const row of rows) {
      const bucket = byMonth.get(row.month) ?? new Map()
      const values = bucket.get(row.categoryId) ?? { assigned: 0n, activity: 0n }
      values[key] += cents(row.amount, true)
      bucket.set(row.categoryId, values); byMonth.set(row.month, bucket)
    }
  }
  const carry = new Map<string, bigint>()
  let pastOverspending = 0n
  let categories = new Map<string, { carry: bigint; assigned: bigint; activity: bigint; available: bigint }>()
  const months = [...new Set([...byMonth.keys(), month])].filter(value => value <= month).sort()
  for (const current of months) {
    categories = new Map()
    const bucket = byMonth.get(current) ?? new Map()
    for (const id of new Set([...carry.keys(), ...bucket.keys()])) {
      const carried = carry.get(id) ?? 0n
      const values = bucket.get(id) ?? { assigned: 0n, activity: 0n }
      const available = carried + values.assigned + values.activity
      categories.set(id, { carry: carried, ...values, available })
      carry.set(id, available > 0n ? available : 0n)
      if (current < month && available < 0n) pastOverspending -= available
    }
  }
  const received = inflows.filter(row => row.month <= month).reduce((sum, row) => sum + cents(row.amount, true), 0n)
  const assigned = assignments.reduce((sum, row) => sum + cents(row.amount, true), 0n)
  const futureAssigned = assignments.filter(row => row.month > month).reduce((sum, row) => sum + cents(row.amount, true), 0n)
  return { categories, readyToAssign: received - assigned - pastOverspending, pastOverspending, futureAssigned }
}
