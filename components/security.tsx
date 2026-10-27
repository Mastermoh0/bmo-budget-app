'use client'
import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { useHydrated } from '@/lib/use-hydrated'

type Device = { id: string; token: string; createdAt: string; expiresAt: string; userAgent: string | null }
export function Security({ name, email, accounts, devices, currentId, googleConfigured }: { name: string; email: string; accounts: { id: string; providerId: string }[]; devices: Device[]; currentId: string; googleConfigured: boolean }) {
  const ready = useHydrated()
  const router = useRouter()
  const providers = accounts.map(account => account.providerId)
  const googleAccountId = accounts.find(account => account.providerId === 'google')?.id ?? ''
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function run(action: () => Promise<{ error?: unknown }>, success: string, reload = false) {
    setBusy(true); setError(''); setMessage('')
    try { const result = await action(); if (result.error) setError('This change could not be completed. Check your details, or sign in again for a fresh session.'); else if (reload) window.location.reload(); else setMessage(success) } catch { setError('The request failed. Please try again.') } finally { setBusy(false) }
  }
  function fields(event: FormEvent<HTMLFormElement>) { event.preventDefault(); return new FormData(event.currentTarget) }
  async function signOut(all: boolean) {
    setBusy(true)
    try { if (all) { const result = await authClient.revokeSessions(); if (result.error) { setError('Could not revoke sessions. Try again.'); return } } await authClient.signOut(); router.replace('/auth/signin'); router.refresh() } catch { setError('Could not sign out. Try again.') } finally { setBusy(false) }
  }
  return <><h1>Account security</h1><p>{email}</p><p className="small muted">Sensitive changes require a sign-in within the last 15 minutes. <Link href="/auth/signin">Sign in again</Link></p>
    {message && <p className="notice" role="status">{message}</p>}{error && <p className="error" role="alert">{error}</p>}
    <section className="panel"><h2>Profile</h2><form method="post" onSubmit={event => { const data = fields(event); void run(() => authClient.updateUser({ name: String(data.get('name')).trim() }), 'Display name updated.') }}><label>Display name<input name="name" defaultValue={name} required maxLength={80} autoComplete="name" /></label><button disabled={!ready || busy}>Save display name</button></form><hr /><form method="post" onSubmit={event => { const data = fields(event); void run(() => authClient.changeEmail({ newEmail: String(data.get('email')).trim().toLowerCase(), callbackURL: '/settings' }), 'Approve the change through your current address, then verify the new address in the local inbox.') }}><label>New email address<input name="email" type="email" required autoComplete="email" /></label><button disabled={!ready || busy}>Request verified email change</button></form></section>
    <section className="panel"><h2>Sign-in methods</h2><p>{providers.includes('credential') ? 'Email and password enabled' : 'No Bimo password set'} · {providers.includes('google') ? 'Google linked' : 'Google not linked'}</p>
      <form method="post" onSubmit={event => { const data = fields(event); const newPassword = String(data.get('newPassword')); if (providers.includes('credential')) void run(() => authClient.changePassword({ currentPassword: String(data.get('currentPassword')), newPassword, revokeOtherSessions: true }), 'Password changed and other sessions revoked.'); else void run(async () => { const response = await fetch('/api/security/add-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newPassword }) }); return response.ok ? {} : { error: true } }, 'Password added.', true) }}>
        {providers.includes('credential') && <label>Current password<input name="currentPassword" type="password" required autoComplete="current-password" /></label>}<label>New password<input name="newPassword" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></label><button disabled={!ready || busy}>{providers.includes('credential') ? 'Change password' : 'Add a Bimo password'}</button>
      </form><hr /><div className="row">{!providers.includes('google') ? <button className="secondary" disabled={!ready || busy || !googleConfigured} onClick={() => run(() => authClient.linkSocial({ provider: 'google', callbackURL: '/settings', errorCallbackURL: '/settings' }), 'Continue in Google')}>Link Google</button> : <button className="secondary" disabled={!ready || busy || providers.length < 2} onClick={() => run(() => authClient.unlinkAccount({ accountId: googleAccountId }), 'Google unlinked.', true)}>Unlink Google</button>}</div>{!googleConfigured && <p className="small muted">Google credentials are not configured yet.</p>}<p className="small muted">Your last working sign-in method cannot be removed. Linking Google never grants Gmail access.</p></section>
    <section className="panel"><h2>Active sessions</h2><div className="stack">{devices.map(device => <div className="row spread" key={device.id}><div><strong>{device.id === currentId ? 'This device' : 'Another device'}</strong><div className="small muted">{device.userAgent?.slice(0, 90) || 'Browser session'}<br />Started {new Date(device.createdAt).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })} (Lagos)</div></div>{device.id !== currentId && <button className="secondary" disabled={!ready || busy} onClick={() => run(() => authClient.revokeSession({ token: device.token }), 'Device signed out.', true)}>Revoke session</button>}</div>)}</div><hr /><div className="row"><button disabled={!ready || busy} onClick={() => signOut(false)}>Sign out this device</button><button className="secondary" disabled={!ready || busy} onClick={() => signOut(true)}>Sign out all devices</button></div></section>
    <section className="panel"><h2>Account deletion</h2><p>Deletion is unavailable in this foundation while budget ownership and retention are implemented. Your account cannot automatically delete or transfer a shared budget.</p></section>
  </>
}
