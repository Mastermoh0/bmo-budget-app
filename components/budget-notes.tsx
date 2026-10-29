'use client'
import type { MoneySnapshot } from '@/lib/money'
import { SaveForm } from './money-form'

export function BudgetNotes({ data }: { data: MoneySnapshot }) {
  return <section className="panel"><h2>Shared budget notes</h2><p className="small muted">Everyone with access can read these notes. Owners and editors can change them. Keep passwords and full bank account numbers out of notes.</p>{(['group', 'category'] as const).map(kind => (kind === 'group' ? data.groups : data.categories).map(row => <details key={`${row.id}-${row.version}`}><summary>{row.name} · {kind}{row.note ? ' · Has note' : ''}</summary><p className="plain-note">{row.note || 'No note yet.'}</p>{data.budget.role !== 'VIEWER' && <SaveForm budgetId={data.budget.id} label="Save note" build={fields => ({ action: 'note', kind, id: row.id, version: row.version, note: fields.note })}><label>Shared note<textarea name="note" defaultValue={row.note} maxLength={1000} rows={3} /></label></SaveForm>}</details>))}</section>
}
