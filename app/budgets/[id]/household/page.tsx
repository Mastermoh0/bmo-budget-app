import { headers } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { verifiedSession } from '@/lib/access'
import { AccessError } from '@/lib/errors'
import { sharingSnapshot } from '@/lib/sharing'
import { Household } from '@/components/household'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  let data
  try {
    const session = await verifiedSession(await headers())
    data = await sharingSnapshot(session.user.id, (await params).id)
  } catch (error) { if (error instanceof AccessError) { if (error.status === 401 || error.status === 403) redirect('/auth/signin'); if (error.status === 404) notFound() } throw error }
  return <Household data={data} />
}
