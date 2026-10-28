import assert from 'node:assert/strict'
import { test } from 'node:test'
import { targetProgress } from '../lib/targets'

test('monthly contribution targets reset, ignore carry/spending/refunds and reflect returned allocations', () => {
  const target = { kind: 'MONTHLY', amount: '5000.00', startMonth: '2026-10', dueDate: null } as const
  assert.equal(targetProgress(target, '2026-10', '3000.00', '7000.00', '2026-10-28').saved, '3000.00')
  assert.equal(targetProgress(target, '2026-10', '3000.00', '-100.00', '2026-10-28').remaining, '2000.00')
  assert.equal(targetProgress(target, '2026-11', '0.00', '7000.00', '2026-10-28').saved, '0.00')
  assert.equal(targetProgress(target, '2026-10', '-100.00', '0.00', '2026-10-28').percent, 0)
  assert.equal(targetProgress(target, '2026-10', '-100.00', '0.00', '2026-10-28').remaining, '5100.00')
  assert.equal(targetProgress(target, '2026-09', '9999.00', '9999.00', '2026-10-28').status, 'NOT_STARTED')
})

test('date targets use current available money, exact rounded-up kobo, deadlines and capped progress', () => {
  const target = { kind: 'BY_DATE', amount: '10000.00', startMonth: '2026-10', dueDate: '2027-01-31' } as const
  const progress = targetProgress(target, '2026-10', '1000.00', '4000.01', '2026-10-28')
  assert.equal(progress.saved, '4000.01'); assert.equal(progress.remaining, '5999.99'); assert.equal(progress.suggested, '1500.00'); assert.equal(progress.monthsLeft, 4)
  assert.equal(targetProgress(target, '2027-02', '0.00', '4000.00', '2026-10-28').status, 'OVERDUE')
  assert.equal(targetProgress(target, '2027-01', '0.00', '10001.00', '2027-01-31').percent, 100)
  assert.equal(targetProgress(target, '2027-01', '0.00', '10001.00', '2027-01-31').status, 'COMPLETE')
  assert.equal(targetProgress(target, '2026-10', '1000.00', '-1.00', '2026-10-28').saved, '0.00')
  assert.equal(targetProgress(target, '2026-10', '1000.00', '-1.00', '2026-10-28').remaining, '10001.00')
  assert.equal(targetProgress(target, '2026-10', '1000.00', '-1.00', '2026-10-28').suggested, '2500.25')
  assert.equal(targetProgress({ ...target, dueDate: '2026-10-10' }, '2026-10', '0.00', '0.00', '2026-10-28').status, 'OVERDUE')
  assert.equal(targetProgress({ ...target, amount: '999999999999999999.99' }, '2026-10', '0.00', '999999999999999999.98', '2026-10-28').remaining, '0.01')
})
