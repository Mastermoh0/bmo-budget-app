'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

export function ForceSignInRedirect({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, status } = useSession()

  useEffect(() => {
    // Auth pages that don't require authentication
    const authPages = [
      '/auth/signin',
      '/auth/signup',
      '/auth/forgot-password',
      '/auth/verify-otp',
      '/auth/reset-password'
    ]
    
    const isAuthPage = authPages.includes(pathname)
    
    // Only redirect if user is NOT authenticated and NOT on an auth page
    if (status === 'unauthenticated' && !isAuthPage) {
      console.log('User not authenticated, redirecting to sign-in')
      router.push('/auth/signin')
    }
    
    // If user is authenticated and on an auth page, redirect to main app
    if (status === 'authenticated' && isAuthPage) {
      console.log('User authenticated, redirecting to main app')
      router.push('/')
    }
  }, [pathname, status, router])

  // Show loading spinner while session is loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show loading while redirecting unauthenticated users
  const authPages = [
    '/auth/signin',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/verify-otp',
    '/auth/reset-password'
  ]
  
  if (status === 'unauthenticated' && !authPages.includes(pathname)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Redirecting to sign-in...</p>
        </div>
      </div>
    )
  }

  // Render children for authenticated users or users on auth pages
  return <>{children}</>
} 