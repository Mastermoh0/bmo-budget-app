'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    // If user is not authenticated, redirect to sign-in
    if (status === 'unauthenticated') {
      console.log('404 - User not authenticated, redirecting to sign-in')
      router.push('/auth/signin')
    }
  }, [status, router])

  // If still loading session, show loading
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

  // If not authenticated, show redirecting message
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Redirecting to sign-in...</p>
        </div>
      </div>
    )
  }

  // For authenticated users, show proper 404 page
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mb-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29.82-5.877 2.172M15 19.128A9.96 9.96 0 0112 21c-2.04 0-3.93-.61-5.5-1.65M12 3a9 9 0 100 18 9 9 0 000-18z" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-600 mb-6">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="space-y-3">
          <Button 
            onClick={() => router.push('/')}
            className="w-full"
          >
            Go to Dashboard
          </Button>
          <Button 
            onClick={() => router.back()}
            variant="outline"
            className="w-full"
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  )
} 