'use client'

import { formatCurrency } from '@/lib/utils'

interface SpendingListProps {
  data: Array<{
    id: string
    name: string
    amount: number
    transactionCount: number
  } & ({ groupName: string; groupId: string } | { categories: string[] })>
  viewMode: 'categories' | 'groups'
  totalSpending: number
}

export function SpendingList({ data, viewMode, totalSpending }: SpendingListProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-sm">No spending to show yet</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm font-medium text-gray-700">
        <span>{viewMode === 'categories' ? 'Categories' : 'Groups'}</span>
        <span>Total Spending</span>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {data.map((item) => {
          const percentage = totalSpending > 0 ? (item.amount / totalSpending) * 100 : 0
          
          return (
            <div key={item.id} className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg px-2 transition-colors">
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
                <div className="text-xs text-gray-400">
                  {percentage.toFixed(1)}% of total spending
                </div>
              </div>
              <div className="text-right ml-4">
                <div className="text-sm font-medium text-gray-900">
                  {formatCurrency(item.amount)}
                </div>
                <div className="text-xs text-gray-500">
                  {item.transactionCount} transaction{item.transactionCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Total Summary */}
      <div className="border-t border-gray-200 pt-3 mt-4">
        <div className="flex items-center justify-between text-sm font-semibold text-gray-900">
          <span>Total</span>
          <span>{formatCurrency(totalSpending)}</span>
        </div>
      </div>
    </div>
  )
} 