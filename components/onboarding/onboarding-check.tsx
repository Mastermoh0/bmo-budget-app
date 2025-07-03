'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'

export function OnboardingCheck() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Skip check if loading, not authenticated, or already on auth/onboarding pages
    if (status === 'loading' || !session || pathname.startsWith('/auth/') || pathname === '/onboarding') {
      return
    }

    // Check onboarding status - only redirect if we successfully get user data and they haven't completed onboarding
    const checkOnboarding = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const userData = await response.json()
          // Only redirect to onboarding if we have valid user data and they haven't completed it
          if (userData && userData.hasCompletedOnboarding === false) {
            console.log('User has not completed onboarding, redirecting...')
            router.push('/onboarding')
          }
        } else {
          // If profile fetch fails, don't redirect to onboarding - let user continue to app
          console.log('Profile fetch failed, allowing user to continue to app')
        }
      } catch (error) {
        // On any error, don't redirect to onboarding - let user continue to app
        console.log('Error checking onboarding status, allowing user to continue:', error)
      }
    }

    checkOnboarding()
  }, [session, status, pathname, router])

  return null // This component doesn't render anything
} 