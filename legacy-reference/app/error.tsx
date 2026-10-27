'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('Application error:', error)
    
    // Check if it's a compilation error, chunk loading error, or other critical failures
    const isCompilationError = error.message?.includes('Loading chunk') ||
                               error.message?.includes('ChunkLoadError') ||
                               error.message?.includes('Loading CSS chunk') ||
                               error.message?.includes('Script error') ||
                               error.digest?.includes('NEXT_') ||
                               error.name === 'ChunkLoadError'

    const isAuthRelatedError = error.message?.includes('Unauthorized') ||
                               error.message?.includes('Authentication') ||
                               error.message?.includes('not found in database')

    // For compilation errors or auth errors, redirect to sign-in after a short delay
    if (isCompilationError || isAuthRelatedError) {
      console.log('Critical error detected, redirecting to sign-in...')
      setTimeout(() => {
        router.push('/auth/signin')
      }, 2000)
    }
  }, [error, router])

  // Check if this is a compilation/chunk loading error
  const isCompilationError = error.message?.includes('Loading chunk') ||
                             error.message?.includes('ChunkLoadError') ||
                             error.message?.includes('Loading CSS chunk') ||
                             error.message?.includes('Script error') ||
                             error.digest?.includes('NEXT_') ||
                             error.name === 'ChunkLoadError'

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: '/auth/signin',
      redirect: true
    })
  }

  if (isCompilationError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Application Update Detected
          </h2>
          <p className="text-gray-600 mb-6">
            The application is being updated. You will be redirected to sign in momentarily...
          </p>
          <Button 
            onClick={() => router.push('/auth/signin')}
            className="w-full"
          >
            Go to Sign In Now
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-6">
          An unexpected error occurred. Please try signing in again or contact support if the problem persists.
        </p>
        <div className="space-y-3">
          <Button 
            onClick={handleSignOut}
            className="w-full"
          >
            Sign In Again
          </Button>
          <Button 
            onClick={reset}
            variant="outline"
            className="w-full"
          >
            Try Again
          </Button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500">
              Debug Info (Development Only)
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
} 