'use client'
import Link, { useLinkStatus } from 'next/link'
import type { ComponentProps } from 'react'

function PendingHint() {
  const { pending } = useLinkStatus()
  return <span className={`navigation-hint ${pending ? 'is-pending' : ''}`} aria-hidden="true" />
}
export function NavLink({ children, ...props }: ComponentProps<typeof Link>) {
  return <Link {...props}>{children}<PendingHint /></Link>
}
