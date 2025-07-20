'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Download, PieChart, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatMonthYear } from '@/lib/utils'
import { SpendingChart } from './spending-chart'
import { SpendingList } from './spending-list'

interface BudgetSpendingData {
  month: Date
  // Transaction data
  totalSpending: number
  transactionCount: number
  // Budget data
  totalBudgeted: number
  totalBudgetActivity: number
  totalAvailable: number
  // Performance metrics
  totalVariance: number
  overallBudgetUtilization: number
  categoriesOverBudget: number
  categoriesUnderBudget: number
  // Category/Group data
  categories: Array<{
    id: string
    name: string
    groupName: string
    groupId: string
    actualSpending: number
    budgeted: number
    available: number
    budgetActivity: number
    variance: number
    budgetUtilization: number
    transactionCount: number
  }>
  groups: Array<{
    id: string
    name: string
    actualSpending: number
    budgeted: number
    available: number
    budgetActivity: number
    variance: number
    budgetUtilization: number
    transactionCount: number
    categories: string[]
  }>
  availableCategories: Array<{
    id: string
    name: string
    categoryGroup: {
      name: string
    }
  }>
  availableAccounts: Array<{
    id: string
    name: string
    type: string
  }>
}

interface Plan {
  id: string
  name: string
  description?: string
  currency: string
  role: 'OWNER' | 'EDITOR' | 'VIEWER'
}

export function ReportsMain() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState<'categories' | 'groups'>('categories')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedAccount, setSelectedAccount] = useState('all')
  const [selectedPlan, setSelectedPlan] = useState('')
  const [plans, setPlans] = useState<Plan[]>([])
  const [spendingData, setSpendingData] = useState<BudgetSpendingData | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user's plans
  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const data = await response.json()
          const userPlans = data.budgets || []
          setPlans(userPlans)
          
          // Set default plan to first one if none selected
          if (userPlans.length > 0 && !selectedPlan) {
            setSelectedPlan(userPlans[0].id)
          }
        }
      } catch (error) {
        console.error('Failed to fetch plans:', error)
      }
    }

    fetchPlans()
  }, [selectedPlan])

  // Fetch spending and budget data
  const fetchSpendingData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        month: currentMonth.toISOString(),
        category: selectedCategory,
        account: selectedAccount,
      })
      
      if (selectedPlan) {
        params.append('planId', selectedPlan)
      }
      
      const response = await fetch(`/api/reports/spending?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSpendingData(data)
      } else {
        console.error('Failed to fetch spending data:', response.status)
        setSpendingData(null)
      }
    } catch (error) {
      console.error('Failed to fetch spending data:', error)
      setSpendingData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedPlan) {
      fetchSpendingData()
    }
  }, [currentMonth, selectedCategory, selectedAccount, selectedPlan])

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() - 1)
      return newDate
    })
  }

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + 1)
      return newDate
    })
  }

  const getCurrentSpendingData = () => {
    if (!spendingData) return []
    return viewMode === 'categories' ? spendingData.categories : spendingData.groups
  }

  // Enhanced export function with budget data
  const handleExport = () => {
    if (!spendingData) return
    
    const data = getCurrentSpendingData()
    const headers = viewMode === 'categories' 
      ? ['Category', 'Group', 'Budgeted', 'Actual Spending', 'Available', 'Variance', 'Budget Utilization %', 'Transactions']
      : ['Group', 'Budgeted', 'Actual Spending', 'Available', 'Variance', 'Budget Utilization %', 'Transactions']
    
    const rows = data.map((item) => {
      if (viewMode === 'categories' && 'groupName' in item) {
        return [
          `"${item.name}"`,
          `"${item.groupName}"`,
          item.budgeted.toFixed(2),
          item.actualSpending.toFixed(2),
          item.available.toFixed(2),
          item.variance.toFixed(2),
          `${item.budgetUtilization.toFixed(1)}%`,
          item.transactionCount
        ].join(',')
      } else {
        return [
          `"${item.name}"`,
          item.budgeted.toFixed(2),
          item.actualSpending.toFixed(2),
          item.available.toFixed(2),
          item.variance.toFixed(2),
          `${item.budgetUtilization.toFixed(1)}%`,
          item.transactionCount
        ].join(',')
      }
    })

    const csvContent = [
      `Budget vs Actual Report - ${formatMonthYear(currentMonth)}`,
      `Plan: ${plans.find(p => p.id === selectedPlan)?.name || 'Unknown'}`,
      `View: ${viewMode === 'categories' ? 'Categories' : 'Groups'}`,
      `Total Budgeted: $${spendingData.totalBudgeted.toFixed(2)}`,
      `Total Actual Spending: $${spendingData.totalSpending.toFixed(2)}`,
      `Total Variance: $${spendingData.totalVariance.toFixed(2)}`,
      `Overall Budget Utilization: ${spendingData.overallBudgetUtilization.toFixed(1)}%`,
      '',
      headers.join(','),
      ...rows
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `budget-vs-actual-report-${formatMonthYear(currentMonth).replace(' ', '-')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const selectedPlanData = plans.find(p => p.id === selectedPlan)

  return (
    <div className="flex-1 bg-white overflow-auto">
      {/* Main Content */}
      <div className="p-6">
        {/* Title and Export */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Budget vs Actual Report</h1>
          <Button
            onClick={handleExport}
            className="flex items-center space-x-2"
            variant="outline"
            disabled={!spendingData}
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </Button>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Plan Selection */}
          {plans.length > 1 && (
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Select Plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} ({plan.role})
                </option>
              ))}
            </select>
          )}

          {/* Month Navigation */}
          <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-1">
            <button
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-white rounded-md transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-4 py-2 text-sm font-medium text-gray-700 min-w-[100px] text-center">
              {formatMonthYear(currentMonth)}
            </div>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-white rounded-md transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Categories</option>
            {spendingData?.availableCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.categoryGroup.name})
              </option>
            ))}
          </select>

          {/* Account Filter */}
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Accounts</option>
            {spendingData?.availableAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.type})
              </option>
            ))}
          </select>
        </div>

        {/* Budget Performance Summary */}
        {spendingData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Total Budgeted</span>
              </div>
              <div className="text-2xl font-bold text-blue-900 mt-1">
                {formatCurrency(spendingData.totalBudgeted)}
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Actual Spending</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(spendingData.totalSpending)}
              </div>
            </div>

            <div className={`border rounded-lg p-4 ${
              spendingData.totalVariance > 0 
                ? 'bg-red-50 border-red-200' 
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center space-x-2">
                {spendingData.totalVariance > 0 ? (
                  <TrendingUp className="w-5 h-5 text-red-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-green-600" />
                )}
                <span className={`text-sm font-medium ${
                  spendingData.totalVariance > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {spendingData.totalVariance > 0 ? 'Over Budget' : 'Under Budget'}
                </span>
              </div>
              <div className={`text-2xl font-bold mt-1 ${
                spendingData.totalVariance > 0 ? 'text-red-900' : 'text-green-900'
              }`}>
                {formatCurrency(Math.abs(spendingData.totalVariance))}
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <PieChart className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">Budget Used</span>
              </div>
              <div className="text-2xl font-bold text-purple-900 mt-1">
                {spendingData.overallBudgetUtilization.toFixed(1)}%
              </div>
              <div className="text-xs text-purple-600 mt-1">
                {spendingData.categoriesOverBudget} over • {spendingData.categoriesUnderBudget} under
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-gray-500">Loading budget data...</div>
          </div>
        ) : !spendingData ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PieChart className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No budget data to show yet</h3>
              <p className="text-gray-600">
                Set up your budget and start tracking to see your budget vs actual performance
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Budget vs Actual</h2>
                  <div className="text-sm text-gray-600 mb-4">
                    {selectedPlanData && `Plan: ${selectedPlanData.name}`}
                  </div>
                </div>
                
                <SpendingChart 
                  data={getCurrentSpendingData()}
                  viewMode={viewMode}
                />
              </div>
            </div>

            {/* Details Section */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                {/* View Mode Toggle */}
                <div className="flex items-center justify-center mb-6">
                  <div className="bg-gray-100 rounded-lg p-1 flex">
                    <button
                      onClick={() => setViewMode('categories')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        viewMode === 'categories'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Categories
                    </button>
                    <button
                      onClick={() => setViewMode('groups')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        viewMode === 'groups'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Groups
                    </button>
                  </div>
                </div>

                <SpendingList
                  data={getCurrentSpendingData()}
                  viewMode={viewMode}
                  totalBudgeted={spendingData.totalBudgeted}
                  totalSpending={spendingData.totalSpending}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
