'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { toggleAppearance } from '@/lib/appearance'
import { useHydrated } from '@/lib/use-hydrated'

type Command = { label: string; hint: string; href?: string; action?: () => void }

function isEditing(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName))
}

export function CommandMenu() {
  const ready = useHydrated(), pathname = usePathname(), router = useRouter()
  const dialog = useRef<HTMLDialogElement>(null), search = useRef<HTMLInputElement>(null), goStartedAt = useRef(0)
  const [query, setQuery] = useState('')
  const open = useCallback(() => {
    if (!dialog.current?.open) dialog.current?.showModal()
    setQuery('')
    requestAnimationFrame(() => search.current?.focus())
  }, [])
  const close = useCallback(() => dialog.current?.close(), [])
  const onBudgetPage = pathname.startsWith('/budgets/')
  const commands: Command[] = [
    { label: 'Your budgets', hint: 'G B', href: '/' },
    { label: 'Account security', hint: 'G S', href: '/settings' },
    ...(onBudgetPage ? [{ label: 'Open notes', hint: 'N', action: () => window.dispatchEvent(new Event('bimo:open-notes')) }] : []),
    { label: 'Toggle appearance', hint: 'T', action: toggleAppearance },
  ]
  const visible = commands.filter(command => command.label.toLowerCase().includes(query.trim().toLowerCase()))

  useEffect(() => {
    if (!ready) return
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); open(); return }
      if (!event.ctrlKey && !event.metaKey && !event.altKey && !isEditing(event.target)) {
        const key = event.key.toLowerCase()
        if (key === 'g') { goStartedAt.current = Date.now(); return }
        if (Date.now() - goStartedAt.current < 900 && ['b', 's'].includes(key)) {
          event.preventDefault(); goStartedAt.current = 0
          router.push(key === 'b' ? '/' : '/settings')
          return
        }
        if (key === 't') { event.preventDefault(); toggleAppearance(); return }
      }
      if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === 'n' && onBudgetPage && !isEditing(event.target)) {
        event.preventDefault(); window.dispatchEvent(new Event('bimo:open-notes'))
      }
    }
    window.addEventListener('keydown', shortcut)
    return () => window.removeEventListener('keydown', shortcut)
  }, [onBudgetPage, open, ready, router])

  function run(command: Command) {
    close()
    if (command.href) router.push(command.href)
    else command.action?.()
  }

  return <><button type="button" className="command-trigger secondary" aria-keyshortcuts="Control+K Meta+K" disabled={!ready} onClick={open}>Quick actions <kbd>Ctrl / ⌘ K</kbd></button>
    <dialog ref={dialog} className="command-menu" aria-labelledby="command-menu-title" onCancel={event => { event.preventDefault(); close() }} onClick={event => { if (event.target === event.currentTarget) close() }}>
      <div className="command-menu-heading"><div><h2 id="command-menu-title">Quick actions</h2><p className="small muted">Use Ctrl / ⌘ K anywhere. On a budget, press N to open Notes.</p></div><button type="button" className="dialog-close secondary" aria-label="Close quick actions" onClick={close}>×</button></div>
      <label className="command-search">Find an action<input ref={search} value={query} onChange={event => setQuery(event.target.value)} placeholder="Search actions" /></label>
      <div className="command-list" aria-label="Available quick actions">{visible.map(command => <button type="button" className="command-option secondary" key={command.label} onClick={() => run(command)}><span>{command.label}</span><kbd>{command.hint}</kbd></button>)}{!visible.length && <p className="muted small">No action matches that search.</p>}</div>
    </dialog>
  </>
}
