'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type Notice = { message: string; actionLabel?: string; action?: () => Promise<void> }
type NoticeContext = { show: (notice: Notice) => void }
const UndoToastContext = createContext<NoticeContext | null>(null)

export function UndoToastProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null), [working, setWorking] = useState(false)
  const show = useCallback((next: Notice) => { setWorking(false); setNotice(next) }, [])
  useEffect(() => {
    if (!notice || working) return
    const timer = window.setTimeout(() => setNotice(null), 6500)
    return () => window.clearTimeout(timer)
  }, [notice, working])
  async function undo() {
    if (!notice?.action || working) return
    setWorking(true)
    try { await notice.action(); setNotice({ message: 'Restored.' }) }
    catch { setNotice({ message: 'Could not undo that change. Refresh and try again.' }) }
    finally { setWorking(false) }
  }
  const value = useMemo(() => ({ show }), [show])
  return <UndoToastContext.Provider value={value}>{children}<div className="toast-region" aria-live="polite" aria-atomic="true">{notice && <div className="undo-toast" role="status"><span>{notice.message}</span>{notice.action && <button type="button" className="secondary" onClick={undo} disabled={working}>{working ? 'Restoring…' : notice.actionLabel ?? 'Undo'}</button>}</div>}</div></UndoToastContext.Provider>
}

export function useUndoToast() {
  const context = useContext(UndoToastContext)
  if (!context) throw new Error('UndoToastProvider is required')
  return context
}
