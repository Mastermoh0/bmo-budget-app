'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { useHydrated } from '@/lib/use-hydrated'

export type AuthMode = 'signin' | 'signup' | 'verify' | 'forgot-password' | 'reset-password'
const titles: Record<AuthMode, string> = { signin: 'Welcome back', signup: 'Create your Bimo account', verify: 'Verify your email', 'forgot-password': 'Reset your password', 'reset-password': 'Choose a new password' }

export function AuthForm({ mode, googleConfigured }: { mode: AuthMode; googleConfigured: boolean }) {
  const ready = useHydrated()
  const query = useSearchParams()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const linkingError = query.get('error') === 'account_not_linked'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    const fields = new FormData(event.currentTarget)
    const email = String(fields.get('email') ?? '').trim().toLowerCase()
    const password = String(fields.get('password') ?? '')
    try {
      let result
      if (mode === 'signup') {
        result = await authClient.signUp.email({ email, password, name: String(fields.get('name') ?? '').trim(), callbackURL: '/setup' })
        if (!result.error) setNotice('Check the local test inbox for your verification link. Verify your email before opening a budget.')
      } else if (mode === 'signin') {
        result = await authClient.signIn.email({ email, password })
        if (!result.error) { router.replace('/'); router.refresh(); return }
      } else if (mode === 'verify') {
        result = await authClient.sendVerificationEmail({ email, callbackURL: '/setup' })
        if (!result.error) setNotice('If this address is eligible, a verification link is in the local test inbox.')
      } else if (mode === 'forgot-password') {
        result = await authClient.requestPasswordReset({ email, redirectTo: '/auth/reset-password' })
        if (!result.error) setNotice('If this address is eligible, a reset link is in the local test inbox.')
      } else {
        const token = query.get('token')
        if (!token) { setError('This reset link is incomplete. Request a new link.'); return }
        result = await authClient.resetPassword({ token, newPassword: password })
        if (!result.error) setNotice('Your password has changed. Sign in again; previous sessions have been revoked.')
      }
      if (result.error) setError(result.error.code === 'EMAIL_NOT_VERIFIED' ? 'Verify your email first. Use the verification link below to request another message.' : result.error.status === 429 ? 'Too many attempts. Please wait a minute before trying again.' : mode === 'signin' ? 'Sign-in failed. Check your details and verification status.' : 'That request could not be completed. Check your details or try again later.')
    } catch { setError('Connection failed. Please try again.') } finally { setBusy(false) }
  }

  async function google() {
    setBusy(true); setError('')
    try { const result = await authClient.signIn.social({ provider: 'google', callbackURL: '/', errorCallbackURL: '/auth/signin' }); if (result.error) setError('Google sign-in could not start. Please try again.') } catch { setError('Google sign-in could not start.') } finally { setBusy(false) }
  }

  return <section className="panel auth"><h1>{titles[mode]}</h1><p className="muted">A fresh account for the new private-budget foundation.</p>
    {linkingError && <p className="error" role="alert">Sign in with your existing method, then link Google in Account security.</p>}
    {notice && <p className="notice" role="status">{notice}</p>}{error && <p className="error" role="alert">{error}</p>}
    <form method="post" onSubmit={submit}>
      {mode === 'signup' && <label>Display name<input name="name" autoComplete="name" maxLength={80} required /></label>}
      {mode !== 'reset-password' && <label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>}
      {['signin', 'signup', 'reset-password'].includes(mode) && <><label>Password<input name="password" type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={mode === 'signin' ? undefined : 12} maxLength={128} aria-describedby={mode === 'signin' ? undefined : 'password-help'} required /></label>{mode !== 'signin' && <p id="password-help" className="muted small">Use 12–128 characters. Passphrases and password managers are welcome.</p>}</>}
      <button disabled={!ready || busy}>{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : mode === 'verify' ? 'Send verification link' : mode === 'forgot-password' ? 'Send reset link' : 'Save new password'}</button>
    </form>
    {['signin', 'signup'].includes(mode) && <><hr /><button className="secondary" disabled={!ready || busy || !googleConfigured} onClick={google}>Continue with Google</button>{!googleConfigured && <p className="small muted">Google is awaiting the developer’s OAuth credentials. No Gmail access is requested.</p>}</>}
    <hr /><div className="stack small"><Link href={mode === 'signin' ? '/auth/signup' : '/auth/signin'}>{mode === 'signin' ? 'Create an account' : 'Back to sign in'}</Link><Link href="/auth/forgot-password">Forgot your password?</Link><Link href="/auth/verify">Resend verification</Link></div>
  </section>
}
