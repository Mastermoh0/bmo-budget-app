'use client'
import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { useHydrated } from '@/lib/use-hydrated'
import { ActionButton } from './action-button'

type Device = { id: string; token: string; createdAt: string; expiresAt: string; userAgent: string | null }
export function Security({ name, email, accounts, devices, currentId, googleConfigured }: { name: string; email: string; accounts: { id: string; providerId: string }[]; devices: Device[]; currentId: string; googleConfigured: boolean }) {
  const ready = useHydrated()
  const router = useRouter()
  const providers = accounts.map(account => account.providerId)
  const googleAccountId = accounts.find(account => account.providerId === 'google')?.id ?? ''
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  async function run(key: string, action: () => Promise<{ error?: unknown }>, success: string, reload = false) {
    setBusy(key); setError(''); setMessage('')
    try { const result = await action(); if (result.error) setError('This change could not be completed. Check your details, or sign in again for a fresh session.'); else if (reload) window.location.reload(); else setMessage(success) } catch { setError('The request failed. Please try again.') } finally { setBusy(null) }
  }
  function fields(event: FormEvent<HTMLFormElement>) { event.preventDefault(); return new FormData(event.currentTarget) }
  async function signOut(all: boolean) {
    setBusy(all ? 'out-all' : 'out'); setError(''); setMessage('')
    try { if (all) { const result = await authClient.revokeSessions(); if (result.error) { setError('Could not revoke sessions. Try again.'); return } } const result = await authClient.signOut(); if (result.error) { setError('Could not sign out. Please try again.'); return } router.replace('/auth/signin'); router.refresh() } catch { setError('Could not sign out. Try again.') } finally { setBusy(null) }
  }
  return <><div className="page-heading"><div><h1>Account security</h1><p className="muted">{email}</p></div></div><p className="small muted">Sensitive changes require a sign-in within the last 15 minutes. <Link href="/auth/signin">Sign in again</Link></p>
    {message && <p className="notice" role="status">{message}</p>}{error && <p className="error" role="alert">{error}</p>}
    <div className="settings-grid"><section className="panel"><h2>Profile</h2><form method="post" onSubmit={event => { const data = fields(event); void run('profile', () => authClient.updateUser({ name: String(data.get('name')).trim() }), 'Display name updated.') }}><label>Display name<input name="name" defaultValue={name} required maxLength={80} autoComplete="name" /></label><ActionButton disabled={!ready || Boolean(busy)} busy={busy === 'profile'} pendingLabel="Saving…">Save display name</ActionButton></form><hr /><form method="post" onSubmit={event => { const data = fields(event); void run('email', () => authClient.changeEmail({ newEmail: String(data.get('email')).trim().toLowerCase(), callbackURL: '/settings' }), 'Approve the change through your current address, then verify the new address in the local inbox.') }}><label>New email address<input name="email" type="email" required autoComplete="email" /></label><ActionButton disabled={!ready || Boolean(busy)} busy={busy === 'email'} pendingLabel="Requesting…">Request verified email change</ActionButton></form></section>
    <section className="panel"><h2>Sign-in methods</h2><p>{providers.includes('credential') ? 'Email and password enabled' : 'No Bimo password set'} · {providers.includes('google') ? 'Google linked' : 'Google not linked'}</p>
      <form method="post" onSubmit={event => { const data = fields(event); const newPassword = String(data.get('newPassword')); if (providers.includes('credential')) void run('password', () => authClient.changePassword({ currentPassword: String(data.get('currentPassword')), newPassword, revokeOtherSessions: true }), 'Password changed and other sessions revoked.'); else void run('password', async () => { const response = await fetch('/api/security/add-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newPassword }) }); return response.ok ? {} : { error: true } }, 'Password added.', true) }}>
        {providers.includes('credential') && <label>Current password<input name="currentPassword" type="password" required autoComplete="current-password" /></label>}<label>New password<input name="newPassword" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></label><ActionButton disabled={!ready || Boolean(busy)} busy={busy === 'password'} pendingLabel="Saving password…">{providers.includes('credential') ? 'Change password' : 'Add a Bimo password'}</ActionButton>
      </form><hr /><div className="row">{!providers.includes('google') ? <ActionButton className="secondary" disabled={!ready || Boolean(busy) || !googleConfigured} busy={busy === 'google'} pendingLabel="Opening…" onClick={() => run('google', () => authClient.linkSocial({ provider: 'google', callbackURL: '/settings', errorCallbackURL: '/settings' }), 'Continue in Google')}>Link Google</ActionButton> : <ActionButton className="secondary" disabled={!ready || Boolean(busy) || providers.length < 2} busy={busy === 'google'} pendingLabel="Opening…" onClick={() => run('google', () => authClient.unlinkAccount({ accountId: googleAccountId }), 'Google unlinked.', true)}>Unlink Google</ActionButton>}</div>{!googleConfigured && <p className="small muted">Google credentials are not configured yet.</p>}<p className="small muted">Your last working sign-in method cannot be removed. Linking Google never grants Gmail access.</p></section>
    <section className="panel"><h2>Active sessions</h2><div className="stack">{devices.map(device => <div className="row spread" key={device.id}><div><strong>{device.id === currentId ? 'This device' : 'Another device'}</strong><div className="small muted">{device.userAgent?.slice(0, 90) || 'Browser session'}<br />Started {new Date(device.createdAt).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })} (Lagos)</div></div>{device.id !== currentId && <ActionButton className="secondary" disabled={!ready || Boolean(busy)} busy={busy === 'device'} pendingLabel="Signing out…" onClick={() => run('device', () => authClient.revokeSession({ token: device.token }), 'Device signed out.', true)}>Revoke session</ActionButton>}</div>)}</div><hr /><div className="row"><ActionButton disabled={!ready || Boolean(busy)} busy={busy === 'out'} pendingLabel="Signing out…" onClick={() => signOut(false)}>Sign out this device</ActionButton><ActionButton className="secondary" disabled={!ready || Boolean(busy)} busy={busy === 'out-all'} pendingLabel="Signing out…" onClick={() => signOut(true)}>Sign out all devices</ActionButton></div></section>
    <section className="panel"><h2>Account deletion</h2><p>Deletion is unavailable in this foundation while budget ownership and retention are implemented. Your account cannot automatically delete or transfer a shared budget.</p></section>
  </div></>
}
