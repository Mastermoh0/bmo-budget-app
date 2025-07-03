import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Let the ForceSignInRedirect component handle auth page redirects
    // Just allow access to protected routes for authenticated users
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Public routes that don't require authentication
        const publicRoutes = [
          '/auth/signin',
          '/auth/signup', 
          '/auth/forgot-password',
          '/auth/verify-otp',
          '/auth/reset-password'
        ]

        // Protected routes that require authentication but should always be accessible
        const protectedRoutes = [
          '/onboarding'
        ]

        // API routes that don't require authentication
        const publicApiRoutes = [
          '/api/auth/signup',
          '/api/auth/forgot-password',
          '/api/auth/verify-otp',
          '/api/auth/reset-password'
        ]

        const { pathname } = req.nextUrl

        // Allow public routes
        if (publicRoutes.includes(pathname) || publicApiRoutes.includes(pathname)) {
          return true
        }

        // Allow NextAuth API routes
        if (pathname.startsWith('/api/auth/')) {
          return true
        }

        // Allow all API routes for authenticated users
        if (pathname.startsWith('/api/') && !!token) {
          return true
        }

        // Allow protected routes for authenticated users
        if (protectedRoutes.includes(pathname) && !!token) {
          return true
        }

        // Require authentication for all other routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-info.txt).*)',
  ],
} 