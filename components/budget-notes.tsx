'use client'
import { useContext, useEffect, useRef, useState } from 'react'
import type { MoneySnapshot } from '@/lib/money'
import { SaveForm } from './money-form'
import { TaskDialog, TaskDialogContext } from './task-dialog'
import { useHydrated } from '@/lib/use-hydrated'

function NoteItem({ data, kind, row }: { data: MoneySnapshot; kind: 'group' | 'category'; row: { id: string; name: string; note: string; version: number } }) {
  const [editing, setEditing] = useState(false), [draft, setDraft] = useState(row.note)
  const editor = useRef<HTMLTextAreaElement>(null), editButton = useRef<HTMLButtonElement>(null)
  const dialog = useContext(TaskDialogContext), ready = useHydrated()
  const locked = !ready || dialog?.phase !== 'idle'
  useEffect(() => { if (editing) editor.current?.focus() }, [editing])
  return <details><summary>{row.name} · {kind}{row.note ? ' · Has note' : ''}</summary>
    <p className="plain-note">{row.note || 'No note yet.'}</p>
    {data.budget.role !== 'VIEWER' && <>
      <div className="note-actions" hidden={editing}>
        <button ref={editButton} type="button" className="secondary" disabled={locked} onClick={() => { setDraft(row.note); setEditing(true) }}>{row.note ? 'Edit note' : 'Add note'}</button>
        <div className="note-delete" hidden={!row.note}><SaveForm budgetId={data.budget.id} label="Delete note" saved={() => setDraft('')} build={() => ({ action: 'note', kind, id: row.id, version: row.version, note: '' })} /></div>
      </div>
      <div hidden={!editing}><SaveForm budgetId={data.budget.id} label="Save note" saved={() => setEditing(false)} build={() => ({ action: 'note', kind, id: row.id, version: row.version, note: draft })}>
        <label>Shared note<textarea ref={editor} name="note" value={draft} onChange={event => setDraft(event.target.value)} maxLength={1000} rows={5} placeholder="Write a note for your household…" /></label>
      </SaveForm><button type="button" className="secondary" disabled={locked} onClick={() => { setEditing(false); requestAnimationFrame(() => editButton.current?.focus()) }}>Cancel edit</button></div>
    </>}
  </details>
}

export function BudgetNotes({ data }: { data: MoneySnapshot }) {
  return <TaskDialog title="Notes" side><section className="budget-notes" aria-label="Shared budget notes"><p className="small muted">Everyone with access can read these notes. Owners and editors can change them. Keep passwords and full bank account numbers out of notes.</p>{!data.groups.length && !data.categories.length && <p>Add a category or group on the Budget page to start keeping shared notes.</p>}{(['group', 'category'] as const).map(kind => (kind === 'group' ? data.groups : data.categories).map(row => <NoteItem key={row.id} data={data} kind={kind} row={row} />))}</section></TaskDialog>
}
