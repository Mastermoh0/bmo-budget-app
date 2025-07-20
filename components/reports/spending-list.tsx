'use client'

import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface SpendingListProps {
  data: Array<{
    id: string
    name: string
    actualSpending: number
    budgeted: number
    available: number
    budgetActivity: number
    variance: number
    budgetUtilization: number
    transactionCount: number
  } & ({ groupName: string; groupId: string } | { categories: string[] })>
  viewMode: 'categories' | 'groups'
  totalBudgeted: number
  totalSpending: number
}

export function SpendingList({ data, viewMode, totalBudgeted, totalSpending }: SpendingListProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-sm">No budget data to show yet</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-gray-700 mb-4">
        <div className="flex items-center justify-between">
          <span>{viewMode === 'categories' ? 'Categories' : 'Groups'}</span>
          <span>Budget vs Actual</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Total Budgeted: {formatCurrency(totalBudgeted)} • Actual Spending: {formatCurrency(totalSpending)}
        </div>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {data.map((item) => {
          const isOverBudget = item.variance > 0
          const isUnderBudget = item.variance < 0
          const isOnTrack = Math.abs(item.variance) < 0.01 // Within 1 cent
          
          return (
            <div key={item.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {item.name}
                  </div>
                  {viewMode === 'categories' && 'groupName' in item && (
                    <div className="text-xs text-gray-500 truncate">
                      {item.groupName}
                    </div>
                  )}
                  {viewMode === 'groups' && 'categories' in item && (
                    <div className="text-xs text-gray-500 truncate">
                      {item.categories.length > 1 
                        ? `${item.categories.length} categories`
                        : item.categories[0]
                      }
                    </div>
                  )}
                </div>
                
                {/* Variance Indicator */}
                <div className="flex items-center space-x-2">
                  {isOverBudget && (
                    <div className="flex items-center space-x-1 text-red-600">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-xs font-medium">Over</span>
                    </div>
                  )}
                  {isUnderBudget && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <TrendingDown className="w-3 h-3" />
                      <span className="text-xs font-medium">Under</span>
                    </div>
                  )}
                  {isOnTrack && (
                    <div className="text-xs font-medium text-blue-600">On Track</div>
                  )}
                </div>
              </div>

              {/* Budget vs Actual Amounts */}
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <div className="text-xs text-gray-500">Budgeted</div>
                  <div className="text-sm font-medium text-blue-600">
                    {formatCurrency(item.budgeted)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Actual</div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(item.actualSpending)}
                  </div>
                </div>
              </div>

              {/* Variance and Utilization */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="text-xs text-gray-500">Variance</div>
                  <div className={`text-sm font-medium ${
                    isOverBudget ? 'text-red-600' : isUnderBudget ? 'text-green-600' : 'text-gray-900'
                  }`}>
                    {isOverBudget ? '+' : ''}{formatCurrency(item.variance)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Budget Used</div>
                  <div className={`text-sm font-medium ${
                    item.budgetUtilization > 100 ? 'text-red-600' : 
                    item.budgetUtilization > 80 ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    {item.budgetUtilization.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {item.budgeted > 0 && (
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        item.budgetUtilization > 100 ? 'bg-red-500' :
                        item.budgetUtilization > 80 ? 'bg-amber-500' : 'bg-green-500'
                      }`}
                      style={{ 
                        width: `${Math.min(item.budgetUtilization, 100)}%` 
                      }}
                    />
                    {/* Overflow indicator for over-budget */}
                    {item.budgetUtilization > 100 && (
                      <div className="text-xs text-red-600 text-right mt-1">
                        {(item.budgetUtilization - 100).toFixed(1)}% over budget
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  {item.transactionCount} transaction{item.transactionCount !== 1 ? 's' : ''}
                </span>
                {item.available !== 0 && (
                  <span>
                    Available: {formatCurrency(item.available)}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Total Summary */}
      <div className="border-t border-gray-200 pt-4 mt-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm font-semibold text-gray-900">
            <span>Total Budgeted</span>
            <span>{formatCurrency(totalBudgeted)}</span>
          </div>
          <div className="flex items-center justify-between text-sm font-semibold text-gray-900">
            <span>Actual Spending</span>
            <span>{formatCurrency(totalSpending)}</span>
          </div>
          <div className={`flex items-center justify-between text-sm font-semibold ${
            totalSpending > totalBudgeted ? 'text-red-600' : 
            totalSpending < totalBudgeted ? 'text-green-600' : 'text-gray-900'
          }`}>
            <span>Variance</span>
            <span>
              {totalSpending > totalBudgeted ? '+' : ''}{formatCurrency(totalSpending - totalBudgeted)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
} 