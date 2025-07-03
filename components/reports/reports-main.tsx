'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Download, PieChart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatMonthYear } from '@/lib/utils'
import { SpendingChart } from './spending-chart'
import { SpendingList } from './spending-list'

interface SpendingData {
  month: Date
  totalSpending: number
  categories: Array<{
    id: string
    name: string
    groupName: string
    groupId: string
    amount: number
    transactionCount: number
  }>
  groups: Array<{
    id: string
    name: string
    amount: number
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
  transactionCount: number
}

// Simplified - focus only on spending breakdown

export function ReportsMain() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState<'categories' | 'groups'>('categories')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedAccount, setSelectedAccount] = useState('all')
  const [spendingData, setSpendingData] = useState<SpendingData | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch spending data
  const fetchSpendingData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        month: currentMonth.toISOString(),
        category: selectedCategory,
        account: selectedAccount,
      })
      
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
    fetchSpendingData()
  }, [currentMonth, selectedCategory, selectedAccount])

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

  // Simple export function
  const handleExport = () => {
    if (!spendingData) return
    
    const data = getCurrentSpendingData()
    const headers = viewMode === 'categories' 
      ? ['Category', 'Group', 'Amount', 'Transactions', 'Percentage']
      : ['Group', 'Amount', 'Transactions', 'Percentage']
    
    const rows = data.map((item) => {
      const percentage = spendingData.totalSpending > 0 ? ((item.amount / spendingData.totalSpending) * 100).toFixed(1) : '0.0'
      
      if (viewMode === 'categories' && 'groupName' in item) {
        return [
          `"${item.name}"`,
          `"${item.groupName}"`,
          item.amount.toFixed(2),
          item.transactionCount,
          `${percentage}%`
        ].join(',')
      } else {
        return [
          `"${item.name}"`,
          item.amount.toFixed(2),
          item.transactionCount,
          `${percentage}%`
        ].join(',')
      }
    })

    const csvContent = [
      `Spending Report - ${formatMonthYear(currentMonth)}`,
      `View: ${viewMode === 'categories' ? 'Categories' : 'Groups'}`,
      `Total Spending: $${spendingData.totalSpending.toFixed(2)}`,
      '',
      headers.join(','),
      ...rows
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `spending-report-${formatMonthYear(currentMonth).replace(' ', '-')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // Removed tab navigation - focus only on spending breakdown

  return (
    <div className="flex-1 bg-white overflow-auto">
      {/* Main Content */}
      <div className="p-6">
        {/* Title and Export */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Spending Breakdown</h1>
          <Button
            onClick={handleExport}
            className="flex items-center space-x-2"
            variant="outline"
            disabled={!spendingData || spendingData.totalSpending === 0}
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </Button>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
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

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-gray-500">Loading spending data...</div>
          </div>
        ) : !spendingData || spendingData.totalSpending === 0 ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PieChart className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No spending to show yet</h3>
              <p className="text-gray-600">
                Your spending breakdown will appear once you start recording your spending
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Total Spending</h2>
                  <div className="text-3xl font-bold text-gray-900">
                    {formatCurrency(spendingData.totalSpending)}
                  </div>
                </div>
                
                <SpendingChart 
                  data={getCurrentSpendingData()}
                  viewMode={viewMode}
                />
              </div>
            </div>

            {/* Details Section */}
            <div className="lg:col-span-1">
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
