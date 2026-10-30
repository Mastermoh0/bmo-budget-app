import { notFound } from 'next/navigation'
import { PracticePage } from '@/components/practice-page'
export default async function Page({ params }: { params: Promise<{ view: string }> }) {
  const { view } = await params
  if (view !== 'accounts' && view !== 'transactions') notFound()
  return <PracticePage view={view} />
}
