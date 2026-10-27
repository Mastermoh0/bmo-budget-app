import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth, googleConfigured } from '@/lib/auth'
import { Security } from '@/components/security'

export default async function SettingsPage() {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  if (!session) redirect('/auth/signin')
  if (!session.user.emailVerified) redirect('/auth/verify')
  const [devices, accounts] = await Promise.all([auth.api.listSessions({ headers: requestHeaders }), auth.api.listUserAccounts({ headers: requestHeaders })])
  return <Security name={session.user.name} email={session.user.email} currentId={session.session.id} googleConfigured={googleConfigured} accounts={accounts.map(account => ({ id: account.id, providerId: account.providerId }))} devices={devices.map(device => ({ id: device.id, token: device.token, createdAt: device.createdAt.toISOString(), expiresAt: device.expiresAt.toISOString(), userAgent: device.userAgent ?? null }))} />
}
