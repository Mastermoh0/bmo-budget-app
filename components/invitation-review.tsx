'use client'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useHydrated } from '@/lib/use-hydrated'
import { userFacingError } from '@/lib/user-errors'
import { ActionButton } from './action-button'

export function InvitationReview() {
  const router = useRouter(), ready = useHydrated(), request = useRef<string | null>(null)
  const [error, setError] = useState(''), [busy, setBusy] = useState<'preview' | 'accept' | null>(null)
  const [preview, setPreview] = useState<{ name: string; role: string; ownership: boolean } | null>(null)
  async function submit(action: 'preview' | 'accept') {
    if (busy) return
    setBusy(action); setError('')
    try {
      const fragment = window.location.hash.slice(1)
      if (fragment) { sessionStorage.setItem('bimo-invitation-v1', fragment); history.replaceState(null, '', '/invitations') }
      const token = sessionStorage.getItem('bimo-invitation-v1')
      if (!token) { setError('Open the complete link from your invitation email.'); return }
      if (action === 'accept') request.current ??= crypto.randomUUID()
      const response = await fetch('/api/invitations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, token, ...(action === 'accept' ? { requestId: request.current } : {}) }) })
      const data = await response.json()
      if (!response.ok) { setError(userFacingError(response.status, data)); if (response.status < 500) request.current = null; return }
      if (data.accepted) { sessionStorage.removeItem('bimo-invitation-v1'); router.push(`/budgets/${data.budgetId}/household`); router.refresh() }
      else setPreview(data)
    } catch { setError('Connection interrupted. Retry to confirm the same acceptance safely.') } finally { setBusy(null) }
  }
  return <section className="panel auth"><h1>Household invitation</h1><p>Sign in using the verified email address that received this invitation, then review it. Google sign-in does not grant mailbox access.</p><div className="row"><Link href="/auth/signin" onClick={() => { const token = location.hash.slice(1); if (token) { sessionStorage.setItem('bimo-invitation-v1', token); history.replaceState(null, '', '/invitations') } }}>Sign in</Link><Link href="/auth/signup" onClick={() => { const token = location.hash.slice(1); if (token) sessionStorage.setItem('bimo-invitation-v1', token) }}>Create account</Link></div><p className="small muted">After signing in or creating your account, return to this invitation page in the same tab. Keep the invitation link private.</p><ActionButton disabled={!ready || Boolean(busy)} busy={busy === 'preview'} pendingLabel="Opening invitation…" onClick={() => submit('preview')}>Review invitation</ActionButton>{preview && <div className="notice"><h2>{preview.name}</h2><p>You are accepting {preview.role.toLowerCase()} access. You will be able to read all financial records and notes in this budget.{preview.ownership ? ' As owner, you will manage access. The previous owner becomes an editor until they choose to leave.' : preview.role === 'EDITOR' ? ' Editors can also change financial records and shared notes.' : ' Viewers cannot edit records or notes.'}</p><ActionButton disabled={Boolean(busy)} busy={busy === 'accept'} pendingLabel="Accepting…" onClick={() => submit('accept')}>{preview.ownership ? 'Accept ownership' : 'Accept invitation'}</ActionButton></div>}{error && <p className="error" role="alert">{error}</p>}</section>
}
