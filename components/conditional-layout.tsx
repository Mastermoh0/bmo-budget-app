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
    <div className="flex h-screen bg-ynab-gray-50">
      {/* Sidebar */}
      <BudgetSidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
} 