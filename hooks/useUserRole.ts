import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

type UserRole = 'OWNER' | 'EDITOR' | 'VIEWER' | null

interface UseUserRoleResult {
  userRole: UserRole
  loading: boolean
  isOwner: boolean
  isEditor: boolean
  isViewer: boolean
  canEdit: boolean // EDITOR or OWNER
  canManagePlans: boolean // OWNER only
}

export function useUserRole(): UseUserRoleResult {
  const searchParams = useSearchParams()
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [loading, setLoading] = useState(true)

  // Get current plan ID from URL or localStorage
  const getCurrentPlanId = () => {
    const urlPlanId = searchParams.get('plan')
    if (urlPlanId) return urlPlanId
    
    // Fallback to localStorage
    return localStorage.getItem('lastSelectedPlan')
  }

  useEffect(() => {
    async function fetchUserRole() {
      try {
        setLoading(true)
        const currentPlanId = getCurrentPlanId()
        
        if (!currentPlanId) {
          setUserRole(null)
          return
        }

        // Fetch user profile to get their role in this specific plan
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const data = await response.json()
          const currentPlan = data.budgets?.find((budget: any) => budget.id === currentPlanId)
          
          if (currentPlan) {
            setUserRole(currentPlan.role)
            console.log('🔍 useUserRole: User role for plan', currentPlanId, ':', currentPlan.role)
          } else {
            console.warn('⚠️ useUserRole: Plan not found in user budgets:', currentPlanId)
            setUserRole(null)
          }
        } else {
          console.error('❌ useUserRole: Failed to fetch user profile')
          setUserRole(null)
        }
      } catch (error) {
        console.error('❌ useUserRole: Error fetching user role:', error)
        setUserRole(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUserRole()
  }, [searchParams]) // Re-fetch when URL parameters change

  return {
    userRole,
    loading,
    isOwner: userRole === 'OWNER',
    isEditor: userRole === 'EDITOR',
    isViewer: userRole === 'VIEWER',
    canEdit: userRole === 'OWNER' || userRole === 'EDITOR',
    canManagePlans: userRole === 'OWNER'
  }
} 