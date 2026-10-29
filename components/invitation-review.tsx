'use client'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useHydrated } from '@/lib/use-hydrated'

export function InvitationReview() {
  const router = useRouter(), ready = useHydrated(), request = useRef<string | null>(null)
  const [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<{ name: string; role: string; ownership: boolean } | null>(null)
  async function submit(action: 'preview' | 'accept') {
    if (busy) return
    setBusy(true); setError('')
    try {
      const fragment = window.location.hash.slice(1)
      if (fragment) { sessionStorage.setItem('bimo-invitation-v1', fragment); history.replaceState(null, '', '/invitations') }
      const token = sessionStorage.getItem('bimo-invitation-v1')
      if (!token) { setError('Open the complete link from your invitation email.'); return }
      if (action === 'accept') request.current ??= crypto.randomUUID()
      const response = await fetch('/api/invitations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, token, ...(action === 'accept' ? { requestId: request.current } : {}) }) })
      const data = await response.json()
      if (!response.ok) { setError(data.error || 'This invitation could not be opened.'); if (response.status < 500) request.current = null; return }
      if (data.accepted) { sessionStorage.removeItem('bimo-invitation-v1'); router.push(`/budgets/${data.budgetId}/household`); router.refresh() }
      else setPreview(data)
    } catch { setError('Connection interrupted. Retry to confirm the same acceptance safely.') } finally { setBusy(false) }
  }
  return <section className="panel auth"><h1>Household invitation</h1><p>Sign in using the verified email address that received this invitation, then review it. Google sign-in does not grant mailbox access.</p><div className="row"><Link href="/auth/signin" onClick={() => { const token = location.hash.slice(1); if (token) { sessionStorage.setItem('bimo-invitation-v1', token); history.replaceState(null, '', '/invitations') } }}>Sign in</Link><Link href="/auth/signup" onClick={() => { const token = location.hash.slice(1); if (token) sessionStorage.setItem('bimo-invitation-v1', token) }}>Create account</Link></div><p className="small muted">After signing in or creating your account, return to this invitation page in the same tab. Keep the invitation link private.</p><button disabled={!ready || busy} onClick={() => submit('preview')}>Review invitation</button>{preview && <div className="notice"><h2>{preview.name}</h2><p>You are accepting {preview.role.toLowerCase()} access. You will be able to read all financial records and notes in this budget.{preview.ownership ? ' As owner, you will manage access. The previous owner becomes an editor until they choose to leave.' : preview.role === 'EDITOR' ? ' Editors can also change financial records and shared notes.' : ' Viewers cannot edit records or notes.'}</p><button disabled={busy} onClick={() => submit('accept')}>{preview.ownership ? 'Accept ownership' : 'Accept invitation'}</button></div>}{error && <p className="error" role="alert">{error}</p>}</section>
}
