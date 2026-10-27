import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { AuthForm, type AuthMode } from '@/components/auth-form'

export default async function AuthPage({ params }: { params: Promise<{ action: string }> }) {
  const { action } = await params
  if (!['signin', 'signup', 'verify', 'forgot-password', 'reset-password'].includes(action)) notFound()
  return <Suspense fallback={<p>Loading account form…</p>}><AuthForm key={action} mode={action as AuthMode} googleConfigured={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)} /></Suspense>
}
