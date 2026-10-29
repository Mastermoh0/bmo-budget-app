'use client'
import { useState } from 'react'
import type { MoneySnapshot } from '@/lib/money'
import { Amount, money, SaveForm } from './money-form'
import { TaskDialog } from './task-dialog'

type Category = MoneySnapshot['categories'][number]
const statuses: Record<string, string> = { NOT_STARTED: 'Not started', COMPLETE: 'Target met', OVERDUE: 'Past deadline', IN_PROGRESS: 'In progress' }

function TargetForm({ data, category }: { data: MoneySnapshot; category: Category }) {
  const target = category.target
  const [kind, setKind] = useState(target?.kind ?? 'MONTHLY')
  const [startMonth, setStartMonth] = useState(target?.startMonth ?? data.month)
  return <SaveForm budgetId={data.budget.id} label={target && !target.removed ? 'Update target' : 'Set target'} build={fields => ({ ...fields, action: 'set-target', categoryId: category.id, version: target?.version ?? 0, kind, startMonth })}><div className="form-grid">
    <label>Target type<select name="kind" value={kind} onChange={event => setKind(event.target.value as 'MONTHLY' | 'BY_DATE')}><option value="MONTHLY">Save an amount each month</option><option value="BY_DATE">Save an amount by a date</option></select></label>
    <Amount label="Target amount (NGN)" value={target?.amount} />
    <label>Start month<input type="month" name="startMonth" value={startMonth} onChange={event => setStartMonth(event.target.value)} required min="1900-01" max="2199-12" /></label>
    {kind === 'BY_DATE' && <label>Save by date<input name="dueDate" type="date" defaultValue={target?.dueDate ?? ''} min={`${startMonth}-01`} max="2199-12-31" required /></label>}
  </div><p className="muted small">{kind === 'MONTHLY' ? 'Counts net money assigned in the selected month. Carryover, spending and refunds do not count as new monthly contributions.' : 'Counts money currently available in this category. Spending lowers progress; refunds and allocations can restore it.'} Updating a target changes its planning guidance; previous settings remain in the change history.</p></SaveForm>
}

export function Targets({ data }: { data: MoneySnapshot }) {
  const canWrite = data.budget.role !== 'VIEWER'
  return <><section className="notice"><strong>Savings targets guide your plan.</strong><p>Setting a target does not allocate money or change any account balance. Use the Budget page to assign money when you have it.</p></section>{!data.categories.length && <section className="panel"><h2>No categories yet</h2><p>Add a category on the Budget page, then give it a target.</p></section>}{data.categories.map(category => {
    const target = category.target, active = target && !target.removed
    return <section key={category.id} className="panel target-card" aria-label={`${category.name} target`}><div className="row spread"><h2>{category.name}{category.archived && ' · Archived'}</h2>{active && <span className={`status ${target.status === 'OVERDUE' ? 'negative' : ''}`}>{statuses[target.status]}</span>}</div><p className="small muted">{data.groups.find(group => group.id === category.groupId)?.name ?? 'Ungrouped'}</p>
      {active ? <><p><strong>{money(target.saved)}</strong> of {money(target.amount)} · {target.kind === 'MONTHLY' ? 'monthly contribution' : `available by ${target.dueDate}`}</p><progress max={100} value={target.percent} aria-label={`${category.name} target progress`} /><p className="small">{target.percent}% · {money(target.remaining)} remaining · Starts {target.startMonth}</p><p><strong>{money(target.suggested)}</strong> {target.kind === 'MONTHLY' ? 'more to assign this month' : `suggested extra per month (${target.monthsLeft} month${target.monthsLeft === 1 ? '' : 's'}, including this month)`}</p>{target.shortfall !== '0.00' && <p className="negative small">Includes {money(target.shortfall)} to {target.kind === 'BY_DATE' ? 'cover negative category availability before saving' : 'replace money returned from this month’s allocations'}.</p>}{target.status === 'NOT_STARTED' && <p className="muted small">This target has not started in the selected month.</p>}{target.status === 'OVERDUE' && <p className="negative small">The deadline has passed in this view. The remaining amount is still unfunded.</p>}</> : <p className="muted">No active target.</p>}
      {canWrite && !category.archived && <TaskDialog title={`${active ? 'Edit' : 'Add'} ${category.name} target`} label={active ? 'Edit target' : 'Add target'}><TargetForm data={data} category={category} /></TaskDialog>}
      {canWrite && active && <div className="target-remove"><SaveForm budgetId={data.budget.id} label="Remove target" build={() => ({ action: 'remove-target', categoryId: category.id, version: target.version })} /><p className="small muted">Removing a target keeps your allocations, balances and financial history.</p></div>}
    </section>
  })}</>
}
