'use client'
import type { MoneySnapshot } from '@/lib/money'
import { SaveForm } from './money-form'
import { TaskDialog } from './task-dialog'

export function BudgetNotes({ data }: { data: MoneySnapshot }) {
  return <TaskDialog title="Notes" side><section className="budget-notes" aria-label="Shared budget notes"><p className="small muted">Everyone with access can read these notes. Owners and editors can change them. Keep passwords and full bank account numbers out of notes.</p>{!data.groups.length && !data.categories.length && <p>Add a category or group on the Budget page to start keeping shared notes.</p>}{(['group', 'category'] as const).map(kind => (kind === 'group' ? data.groups : data.categories).map(row => <details key={row.id}><summary>{row.name} · {kind}{row.note ? ' · Has note' : ''}</summary><p className="plain-note">{row.note || 'No note yet.'}</p>{data.budget.role !== 'VIEWER' && <SaveForm budgetId={data.budget.id} label="Save note" build={fields => ({ action: 'note', kind, id: row.id, version: row.version, note: fields.note })}><label>Shared note<textarea name="note" defaultValue={row.note} maxLength={1000} rows={5} placeholder="Write a note for your household…" /></label></SaveForm>}</details>))}</section></TaskDialog>
}
