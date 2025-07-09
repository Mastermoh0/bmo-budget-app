'use client'

import { usePathname } from 'next/navigation'
import { BudgetSidebar } from '@/components/budget/budget-sidebar'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  
  // Routes where sidebar should NOT be shown
  const authRoutes = [
    '/auth/signin',
    '/auth/signup', 
    '/auth/forgot-password',
    '/auth/verify-otp',
    '/auth/reset-password'
  ]
  
  const noSidebarRoutes = [
    ...authRoutes,
    '/onboarding'
  ]
  
  const isNoSidebarPage = noSidebarRoutes.includes(pathname)

  if (isNoSidebarPage) {
    // Auth and onboarding pages: full-width layout without sidebar
    return (
      <div className="min-h-screen">
        {children}
      </div>
    )
  }

  // Main app pages: layout with sidebar
  return (
    <div className="min-h-screen bg-ynab-gray-50">
      {/* Fixed Sidebar */}
      <BudgetSidebar />
      
      {/* Main Content Area with left margin to account for fixed sidebar */}
      <div className="ml-64 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  )
} 