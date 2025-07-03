'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar, DollarSign, ChevronDown, Check } from 'lucide-react'
import { formatMonthYear, formatCurrency, getCurrentMonth, addMonths } from '@/lib/utils'

interface Plan {
  id: string
  name: string
  description?: string
  currency: string
}

interface BudgetHeaderProps {
  selectedPlanId?: string
  onPlanChange?: (planId: string) => void
}

export function BudgetHeader({ selectedPlanId, onPlanChange }: BudgetHeaderProps) {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth())
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

  // Fetch budget data to get "To Be Budgeted" amount
  useEffect(() => {
    async function fetchBudgetData() {
      if (!selectedPlanId) return
      
      try {
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
    setCurrentMonth(prev => addMonths(prev, -1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1))
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
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {/* Plan Dropdown */}
          {showPlanDropdown && plans.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
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
                      <div className="text-xs text-gray-400">{plan.currency}</div>
                    </div>
                    {selectedPlanId === plan.id && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                ))}
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
          
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-ynab-gray-600" />
            <h1 className="text-xl font-semibold text-ynab-gray-800">
              {formatMonthYear(currentMonth)}
            </h1>
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
      <div className="flex items-center space-x-2">
        <DollarSign className="w-5 h-5 text-ynab-blue" />
        <div className="text-right">
          <div className="text-sm text-ynab-gray-600">To Be Budgeted</div>
          <div className={`text-lg font-semibold ${
            loading ? 'text-ynab-gray-400' : 
            toBeBudgeted > 0 ? 'text-ynab-green' : 
            toBeBudgeted < 0 ? 'text-ynab-red' : 'text-ynab-gray-600'
          }`}>
            {loading ? 'Loading...' : formatCurrency(toBeBudgeted)}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showPlanDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowPlanDropdown(false)}
        />
      )}
    </div>
  )
} 