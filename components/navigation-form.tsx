'use client'
import { useTransition, type ReactNode, type FormEvent } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ActionButton } from './action-button'

export function NavigationForm({ children, label, className }: { children: ReactNode; label: string; className?: string }) {
  const [pending, startTransition] = useTransition(), router = useRouter(), pathname = usePathname()
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const query = new URLSearchParams()
    for (const [key, value] of new FormData(event.currentTarget)) if (typeof value === 'string' && value) query.set(key, value)
    startTransition(() => router.push(`${pathname}?${query}`))
  }
  return <form method="get" onSubmit={submit} className={className} aria-busy={pending}>{children}<ActionButton busy={pending} pendingLabel="Updating…">{label}</ActionButton></form>
}
