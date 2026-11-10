'use client'
import { useContext, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { MoneySnapshot } from '@/lib/money'
import { userFacingError } from '@/lib/user-errors'
import { SaveForm } from './money-form'
import { TaskDialog, TaskDialogContext, type TaskDialogHandle } from './task-dialog'
import { useHydrated } from '@/lib/use-hydrated'
import { useUndoToast } from './undo-toast'

function NoteDeleteButton({ budgetId, kind, row, onPending, onFailure }: { budgetId: string; kind: 'group' | 'category'; row: { id: string; note: string; version: number }; onPending: () => void; onFailure: () => void }) {
  const router = useRouter(), { show } = useUndoToast(), dialog = useContext(TaskDialogContext)
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [, startTransition] = useTransition()
  async function save(note: string, version: number) {
    const response = await fetch(`/api/budgets/${budgetId}/money`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'note', kind, id: row.id, version, note, requestId: crypto.randomUUID() }) })
    const result = await response.json() as { version?: number; error?: string; code?: string }, resultVersion = result.version
    if (!response.ok || typeof resultVersion !== 'number' || !Number.isSafeInteger(resultVersion)) throw new Error(userFacingError(response.status, result))
    return resultVersion
  }
  async function remove() {
    if (busy) return
    setBusy(true); setError(''); onPending(); dialog?.progress('saving')
    try {
      const version = await save('', row.version)
      startTransition(() => router.refresh())
      show({ message: 'Note deleted.', actionLabel: 'Undo', action: async () => { await save(row.note, version); startTransition(() => router.refresh()) } })
    } catch (reason) { onFailure(); setError(reason instanceof Error ? reason.message : 'Could not delete this note. Try again.') }
    finally { setBusy(false); dialog?.progress('idle') }
  }
  return <div className="note-delete"><button type="button" disabled={busy} onClick={() => { void remove() }}>{busy ? 'Deleting…' : 'Delete note'}</button>{error && <p role="alert" className="error">{error}</p>}</div>
}

function NoteItem({ data, kind, row }: { data: MoneySnapshot; kind: 'group' | 'category'; row: { id: string; name: string; note: string; version: number } }) {
  const [editing, setEditing] = useState(false), [draft, setDraft] = useState(row.note), [deletingVersion, setDeletingVersion] = useState<number | null>(null)
  const editor = useRef<HTMLTextAreaElement>(null), editButton = useRef<HTMLButtonElement>(null)
  const dialog = useContext(TaskDialogContext), ready = useHydrated()
  const locked = !ready || dialog?.phase !== 'idle'
  useEffect(() => { if (editing) editor.current?.focus() }, [editing])
  const deleting = deletingVersion === row.version
  return <details><summary>{row.name} · {kind}{row.note ? ' · Has note' : ''}</summary>
    <p className="plain-note">{deleting ? 'Removing note…' : row.note || 'No note yet.'}</p>
    {data.budget.role !== 'VIEWER' && <>
      <div className="note-actions" hidden={editing}>
        <button ref={editButton} type="button" className="secondary" disabled={locked} onClick={() => { setDraft(row.note); setEditing(true) }}>{row.note ? 'Edit note' : 'Add note'}</button>
        {row.note && !deleting && <NoteDeleteButton budgetId={data.budget.id} kind={kind} row={row} onPending={() => setDeletingVersion(row.version)} onFailure={() => setDeletingVersion(null)} />}
      </div>
      <div hidden={!editing}><SaveForm budgetId={data.budget.id} label="Save note" saved={() => setEditing(false)} build={() => ({ action: 'note', kind, id: row.id, version: row.version, note: draft })}>
        <label>Shared note<textarea ref={editor} name="note" value={draft} onChange={event => setDraft(event.target.value)} maxLength={1000} rows={5} placeholder="Write a note for your household…" /></label>
      </SaveForm><button type="button" className="secondary" disabled={locked} onClick={() => { setEditing(false); requestAnimationFrame(() => editButton.current?.focus()) }}>Cancel edit</button></div>
    </>}
  </details>
}

export function BudgetNotes({ data }: { data: MoneySnapshot }) {
  const notes = useRef<TaskDialogHandle>(null)
  useEffect(() => {
    const open = () => notes.current?.open()
    window.addEventListener('bimo:open-notes', open)
    return () => window.removeEventListener('bimo:open-notes', open)
  }, [])
  return <TaskDialog ref={notes} title="Notes" side><section className="budget-notes" aria-label="Shared budget notes"><p className="small muted">Everyone with access can read these notes. Owners and editors can change them. Keep passwords and full bank account numbers out of notes.</p>{!data.groups.length && !data.categories.length && <p>Add a category or group on the Budget page to start keeping shared notes.</p>}{(['group', 'category'] as const).map(kind => (kind === 'group' ? data.groups : data.categories).map(row => <NoteItem key={row.id} data={data} kind={kind} row={row} />))}</section></TaskDialog>
}
