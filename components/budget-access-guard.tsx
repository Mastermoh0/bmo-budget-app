'use client'
import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'

export function BudgetAccessGuard({ id, children }: { id: string; children: ReactNode }) {
  const [denied, setDenied] = useState(false)
  useEffect(() => {
    let disposed = false, pending = false
    const check = async () => {
      if (document.hidden || pending) return
      pending = true
      try {
        const response = await fetch(`/api/budgets/${id}`, { cache: 'no-store' })
        if (!disposed && [401, 403, 404].includes(response.status)) setDenied(true)
      } catch { /* Offline views cannot establish revocation; every authoritative request still checks access. */ }
      finally { pending = false }
    }
    const interval = setInterval(check, 60000)
    window.addEventListener('focus', check); document.addEventListener('visibilitychange', check)
    return () => { disposed = true; clearInterval(interval); window.removeEventListener('focus', check); document.removeEventListener('visibilitychange', check) }
  }, [id])
  return denied ? <section className="panel" role="alert"><h1>This budget is no longer available</h1><p>Your access or session changed. Previously saved downloads cannot be recalled.</p><Link href="/">Return to your budgets</Link></section> : children
}
