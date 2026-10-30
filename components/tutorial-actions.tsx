'use client'
import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ActionButton } from './action-button'
import { useHydrated } from '@/lib/use-hydrated'
import { userFacingError } from '@/lib/user-errors'

type Action = 'start' | 'resume' | 'restart' | 'skip' | 'challenge' | 'finish'
export function TutorialActions({ version, actions }: { version: number; actions: { action: Action; label: string; secondary?: boolean }[] }) {
  const ready = useHydrated(), router = useRouter(), request = useRef<{ action: Action; version: number; requestId: string } | null>(null)
  const [busy, setBusy] = useState<Action | null>(null), [retry, setRetry] = useState<Action | null>(null), [error, setError] = useState(''), [refreshing, transition] = useTransition()
  async function act(action: Action) {
    if (busy || refreshing || (request.current && request.current.action !== action)) return
    request.current ??= { action, version, requestId: crypto.randomUUID() }
    setBusy(action); setError('')
    try {
      const response = await fetch('/api/tutorial', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request.current) })
      const result = await response.json()
      if (!response.ok) {
        setError(userFacingError(response.status, result))
        if (response.status < 500) { request.current = null; setRetry(null) } else setRetry(action)
        return
      }
      if (!['/', '/learn/practice', '/learn/practice/accounts', '/learn/practice/transactions'].includes(result.destination)) throw Error('Unexpected learning destination')
      request.current = null; setRetry(null)
      transition(() => { router.push(result.destination); router.refresh() })
    } catch { setRetry(action); setError('That action was not confirmed. Retry the same button safely, or reopen Learn Bimo to check your progress.') } finally { setBusy(null) }
  }
  return <div className="tutorial-actions"><div className="row">{actions.map(item => <ActionButton key={item.action} type="button" className={item.secondary ? 'secondary' : undefined} disabled={!ready || Boolean(busy) || refreshing || Boolean(retry && retry !== item.action)} busy={busy === item.action || refreshing} pendingLabel="Updating…" onClick={() => act(item.action)}>{item.label}</ActionButton>)}</div>{error && <p role="alert" className="error">{error}</p>}</div>
}
