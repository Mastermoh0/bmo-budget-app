'use client'
import { createContext, useCallback, useId, useImperativeHandle, useMemo, useRef, useState, type ReactNode, type Ref } from 'react'
import { useHydrated } from '@/lib/use-hydrated'

type Phase = 'idle' | 'saving' | 'unconfirmed'
export const TaskDialogContext = createContext<{ phase: Phase; progress: (phase: Phase) => void; complete: () => void } | null>(null)
export type TaskDialogHandle = { open: () => void }

export function TaskDialog({ title, label = title, children, ref, className = 'secondary' }: { title: string; label?: string; children: ReactNode; ref?: Ref<TaskDialogHandle>; className?: string }) {
  const ready = useHydrated(), id = useId(), dialog = useRef<HTMLDialogElement>(null), heading = useRef<HTMLHeadingElement>(null)
  const current = useRef<Phase>('idle'), outsideStart = useRef(false)
  const [phase, setPhase] = useState<Phase>('idle'), [generation, setGeneration] = useState(0), [visible, setVisible] = useState(false)
  const progress = useCallback((value: Phase) => { current.current = value; setPhase(value) }, [])
  const complete = useCallback(() => {
    dialog.current?.close(); setVisible(false); current.current = 'idle'; setPhase('idle'); setGeneration(value => value + 1)
  }, [])
  function dismiss() {
    if (current.current === 'saving') return
    dialog.current?.close(); setVisible(false)
    // An uncertain save keeps its original request and fields when reopened.
    if (current.current !== 'unconfirmed') setGeneration(value => value + 1)
  }
  const open = useCallback(() => { if (current.current === 'saving') return; if (current.current !== 'unconfirmed') setGeneration(value => value + 1); dialog.current?.showModal(); setVisible(true); heading.current?.focus() }, [])
  useImperativeHandle(ref, () => ({ open }), [open])
  const context = useMemo(() => ({ phase, progress, complete }), [phase, progress, complete])
  function outside(event: { clientX: number; clientY: number }) {
    const bounds = dialog.current?.getBoundingClientRect()
    return !!bounds && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)
  }
  return <><button type="button" className={className} disabled={!ready || phase === 'saving'} onClick={open}>{label}</button>
    {!visible && phase === 'unconfirmed' && <span className="small pending-save-note" role="status">Save unconfirmed. Reopen {title.toLowerCase()} to retry safely.</span>}
    <dialog ref={dialog} className="task-dialog" aria-labelledby={id} onCancel={event => { event.preventDefault(); dismiss() }} onPointerDown={event => { outsideStart.current = event.target === event.currentTarget && outside(event) }} onClick={event => { if (outsideStart.current && event.target === event.currentTarget && outside(event)) dismiss(); outsideStart.current = false }}>
      <div className="task-dialog-heading"><h2 id={id} ref={heading} tabIndex={-1}>{title}</h2><button type="button" className="dialog-close secondary" aria-label={`Close ${title.toLowerCase()}`} disabled={phase === 'saving'} onClick={dismiss}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button></div>
      <TaskDialogContext.Provider value={context}><div key={generation} className="task-dialog-content">{children}</div></TaskDialogContext.Provider>
      <div className="task-dialog-footer"><button type="button" className="secondary" disabled={phase === 'saving'} onClick={dismiss}>Cancel</button>{phase === 'saving' && <p className="small muted" role="status">Saving your change. This window will close when it is confirmed.</p>}{phase === 'unconfirmed' && <p className="small muted">If you close this window, your original save will be kept for a safe retry.</p>}</div>
    </dialog></>
}
