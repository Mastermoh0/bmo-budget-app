'use client'

import { ReactNode, useEffect, useState } from 'react'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@/components/ui/toaster'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <SessionProvider>
      {children}
      <Toaster />
    </SessionProvider>
  )
} 