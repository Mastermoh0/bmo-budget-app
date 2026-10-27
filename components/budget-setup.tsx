'use client'
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useHydrated } from '@/lib/use-hydrated'

export function BudgetSetup() {
  const ready = useHydrated()
  const router = useRouter()
  const [requestId] = useState(() => crypto.randomUUID())
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('')
    const fields = new FormData(event.currentTarget)
    try {
      const response = await fetch('/api/budgets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: fields.get('name'), currency: 'NGN', timezone: 'Africa/Lagos', requestId }) })
      if (!response.ok) { const result = await response.json(); setError(result.error); return }
      router.replace('/'); router.refresh()
    } catch { setError('The budget could not be saved. Retrying this form will not create a duplicate.') } finally { setBusy(false) }
  }
  return <form method="post" onSubmit={submit}><label>Budget name<input name="name" placeholder="My everyday budget" required maxLength={80} /></label><label>Currency<input value="NGN · Nigerian naira" readOnly /></label><label>Budget timezone<input value="Africa/Lagos" readOnly /></label>{error && <p role="alert" className="error">{error}</p>}<button disabled={!ready || busy}>{busy ? 'Creating…' : 'Create private budget'}</button></form>
}
