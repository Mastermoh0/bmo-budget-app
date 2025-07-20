'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar, DollarSign, ChevronDown, Check, Plus } from 'lucide-react'
import { formatMonthYear, formatCurrency, addMonths } from '@/lib/utils'
import { useUserRole } from '@/hooks/useUserRole'

interface Plan {
  id: string
  name: string
  description?: string
  currency: string
  role: 'OWNER' | 'EDITOR' | 'VIEWER'
}

interface BudgetHeaderProps {
  selectedPlanId: string
  onPlanChange?: (planId: string) => void
  currentMonth: Date
  onMonthChange: (month: Date) => void
}

export function BudgetHeader({ selectedPlanId, onPlanChange, currentMonth, onMonthChange }: BudgetHeaderProps) {
  const { canManagePlans, isOwner } = useUserRole()
  const [toBeBudgeted, setToBeBudgeted] = useState(0)
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<Plan[]>([])
  const [showPlanDropdown, setShowPlanDropdown] = useState(false)
  const [loadingPlans, setLoadingPlans] = useState(true)

  // Fetch user's plans
  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const data = await response.json()
          setPlans(data.budgets || [])
        }
      } catch (error) {
        console.error('Failed to fetch plans:', error)
      } finally {
        setLoadingPlans(false)
      }
    }

    fetchPlans()
  }, [])

  // Fetch budget data to get "To Be Budgeted" amount when month or plan changes
  useEffect(() => {
    async function fetchBudgetData() {
      if (!selectedPlanId) return
      
      try {
        setLoading(true)
        const response = await fetch(`/api/budgets?month=${currentMonth.toISOString()}&planId=${selectedPlanId}`)
        if (response.ok) {
          const data = await response.json()
          setToBeBudgeted(data.toBeBudgeted)
        }
      } catch (error) {
        console.error('Failed to fetch budget data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBudgetData()
  }, [currentMonth, selectedPlanId])

  const handlePreviousMonth = () => {
    const newMonth = addMonths(currentMonth, -1)
    onMonthChange(newMonth)
  }

  const handleNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1)
    onMonthChange(newMonth)
  }

  const handlePlanSelect = (planId: string) => {
    if (onPlanChange) {
      onPlanChange(planId)
    }
    setShowPlanDropdown(false)
  }

  const selectedPlan = plans.find(plan => plan.id === selectedPlanId)

  return (
    <div className="bg-white border-b border-ynab-gray-200 px-6 py-4 flex items-center justify-between">
      {/* Plan Selector & Month Navigation */}
      <div className="flex items-center space-x-6">
        {/* Plan Selector */}
        <div className="relative">
          <button
            onClick={() => setShowPlanDropdown(!showPlanDropdown)}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            disabled={loadingPlans || plans.length === 0}
          >
            <span className="font-medium text-gray-900">
              {loadingPlans ? 'Loading...' : selectedPlan ? selectedPlan.name : 'Select Plan'}
            </span>
            {selectedPlan && (
              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                {selectedPlan.role}
              </span>
            )}
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {/* Plan Dropdown */}
          {showPlanDropdown && (
            <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="py-1">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => handlePlanSelect(plan.id)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{plan.name}</div>
                      {plan.description && (
                        <div className="text-sm text-gray-500">{plan.description}</div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {plan.role}
                      </span>
                      {plan.id === selectedPlanId && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                  </button>
                ))}
                
                {canManagePlans && (
                  <>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={() => {
                        // TODO: Implement create new plan functionality
                        alert('Create new plan functionality coming soon!')
                        setShowPlanDropdown(false)
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center space-x-2 text-blue-600"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="font-medium">Create New Plan</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Month Navigation */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-ynab-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-ynab-gray-600" />
            <div className="flex flex-col">
              <h1 className="text-xl font-semibold text-ynab-gray-800">
                {formatMonthYear(currentMonth)}
              </h1>
              {(() => {
                const now = new Date()
                const currentYear = now.getFullYear()
                const currentMonthNum = now.getMonth()
                const selectedYear = currentMonth.getFullYear()
                const selectedMonthNum = currentMonth.getMonth()
                
                if (selectedYear < currentYear || (selectedYear === currentYear && selectedMonthNum < currentMonthNum)) {
                  return <span className="text-xs text-amber-600 font-medium">Historical</span>
                } else if (selectedYear === currentYear && selectedMonthNum === currentMonthNum) {
                  return <span className="text-xs text-green-600 font-medium">Current Month</span>
                } else {
                  return <span className="text-xs text-blue-600 font-medium">Planning Ahead</span>
                }
              })()}
            </div>
          </div>
          
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-ynab-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* To Be Budgeted */}
      <div className="text-right">
        <div className="text-sm text-ynab-gray-600">To Be Budgeted</div>
        {loading ? (
          <div className="text-lg font-semibold text-ynab-gray-400">Loading...</div>
        ) : (
          <div className={`text-lg font-semibold ${
            toBeBudgeted < 0 ? 'text-ynab-red' : toBeBudgeted > 0 ? 'text-ynab-blue' : 'text-ynab-gray-600'
          }`}>
            {formatCurrency(toBeBudgeted)}
          </div>
        )}
      </div>
    </div>
  )
} 