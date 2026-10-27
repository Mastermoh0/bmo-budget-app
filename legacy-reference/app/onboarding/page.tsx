'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import OnboardingSlideshow from '@/components/onboarding/onboarding-slideshow'

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session } = useSession()

  if (!session) {
    router.push('/auth/signin')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-400 to-emerald-600">
      <OnboardingSlideshow />
    </div>
  )
} 