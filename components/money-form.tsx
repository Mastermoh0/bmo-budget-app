'use client'
import { useRef, useState, useTransition, type FormEvent, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useHydrated } from '@/lib/use-hydrated'
import { userFacingError } from '@/lib/user-errors'
import { ActionButton } from './action-button'

type Fields = Record<string, FormDataEntryValue>

export function money(value: string) {
  const [whole, fraction = '00'] = value.split('.')
  return `${whole.startsWith('-') ? '−' : ''}₦${whole.replace('-', '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction.padEnd(2, '0')}`
}

export function SaveForm({ budgetId, children, build, label, saved, disabled = false, endpoint = 'money' }: { budgetId: string; children?: ReactNode; build: (fields: Fields) => object; label: string; saved?: () => void; disabled?: boolean; endpoint?: 'money' | 'sharing' }) {
  const ready = useHydrated(), router = useRouter()
  const [refreshing, startTransition] = useTransition()
  const pending = useRef<{ requestId: string; body: object } | null>(null)
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || refreshing || disabled) return
    if (!pending.current) pending.current = { requestId: crypto.randomUUID(), body: build(Object.fromEntries(new FormData(event.currentTarget))) }
    setBusy(true); setError(''); setSuccess('')
    try {
      const response = await fetch(`/api/budgets/${budgetId}/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...pending.current.body, requestId: pending.current.requestId }) })
      const result = await response.json()
      if (!response.ok) { setError(`${userFacingError(response.status, result)}${response.status >= 500 ? ' Retrying sends your original details, even if you edit the fields.' : ''}`); if (response.status < 500) pending.current = null; return }
      pending.current = null; setSuccess('Saved.')
      startTransition(() => { saved?.(); router.refresh() })
    } catch { setError('Save not confirmed. Retry to send the same change safely, even if you have edited the fields.') } finally { setBusy(false) }
  }
  return <form method="post" onSubmit={submit} aria-busy={busy || refreshing}><fieldset disabled={!ready || busy || refreshing || disabled}>{children}<ActionButton disabled={!ready || disabled} busy={busy || refreshing} pendingLabel="Saving…">{label}</ActionButton></fieldset>{error && <p role="alert" className="error">{error}</p>}{success && <p role="status" className="success">{success}</p>}</form>
}

export function Amount({ label = 'Amount (NGN)', value = '', signed = false }: { label?: string; value?: string; signed?: boolean }) {
  return <label>{label}<input name="amount" inputMode="decimal" defaultValue={value} required pattern={signed ? /-?(0|[1-9][0-9]*)(\.[0-9]{1,2})?/.source : /(0|[1-9][0-9]*)(\.[0-9]{1,2})?/.source} placeholder="0.00" maxLength={22} /></label>
}
