'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { ChevronDown, ChevronRight, Target, Plus } from 'lucide-react'
import { formatCurrency, getCurrentMonth } from '@/lib/utils'
import { CategoryGroupEditor } from './CategoryGroupEditor'
import { CategoryEditor } from './CategoryEditor'
import { BudgetAmountInput } from './BudgetAmountInput'

interface Category {
  id: string
  name: string
  budgeted: number
  activity: number
  available: number
}

interface CategoryGroup {
  id: string
  name: string
  categories: Category[]
}

interface BudgetData {
  month: Date
  toBeBudgeted: number
  totalBudgeted: number
  totalActivity: number
  totalAvailable: number
  categoryGroups: CategoryGroup[]
}

export function BudgetMain() {
  const router = useRouter()
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentMonth] = useState(getCurrentMonth())

  // Handle authentication/user errors by redirecting to sign-in
  const handleAuthError = async (error: string) => {
    console.log('Authentication error detected:', error)
    await signOut({
      callbackUrl: '/auth/signin',
      redirect: true
    })
  }

  // Fetch budget data from API
  useEffect(() => {
    async function fetchBudgetData() {
      try {
        const response = await fetch(`/api/budgets?month=${currentMonth.toISOString()}`)
        if (response.ok) {
          const data = await response.json()
          setBudgetData(data)
          // Auto-expand all groups initially
          setExpandedGroups(data.categoryGroups.map((group: CategoryGroup) => group.id))
        } else {
          const errorData = await response.json()
          
          // Check if it's an authentication/user error
          if (response.status === 401 || 
              errorData.error?.includes('not found in database') ||
              errorData.error?.includes('User not found') ||
              errorData.error?.includes('Unauthorized')) {
            await handleAuthError(errorData.error)
            return
          }
          
          console.error('Failed to fetch budget data:', errorData)
        }
      } catch (error) {
        console.error('Failed to fetch budget data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBudgetData()
  }, [currentMonth])

  // Handler functions for category group operations
  const handleUpdateGroup = (updatedGroup: CategoryGroup) => {
    setBudgetData(prev => {
      if (!prev) return null
      return {
        ...prev,
        categoryGroups: prev.categoryGroups.map(group =>
          group.id === updatedGroup.id ? updatedGroup : group
        )
      }
    })
  }

  const handleDeleteGroup = (groupId: string) => {
    setBudgetData(prev => {
      if (!prev) return null
      return {
        ...prev,
        categoryGroups: prev.categoryGroups.filter(group => group.id !== groupId)
      }
    })
    setExpandedGroups(prev => prev.filter(id => id !== groupId))
  }

  const handleAddGroup = (newGroup: CategoryGroup) => {
    setBudgetData(prev => {
      if (!prev) return null
      return {
        ...prev,
        categoryGroups: [...prev.categoryGroups, newGroup]
      }
    })
    setExpandedGroups(prev => [...prev, newGroup.id])
  }

  // Handler functions for category operations
  const handleUpdateCategory = (groupId: string, updatedCategory: Category) => {
    setBudgetData(prev => {
      if (!prev) return null
      return {
        ...prev,
        categoryGroups: prev.categoryGroups.map(group =>
          group.id === groupId
            ? {
                ...group,
                categories: group.categories.map(cat =>
                  cat.id === updatedCategory.id ? updatedCategory : cat
                )
              }
            : group
        )
      }
    })
  }

  const handleDeleteCategory = (groupId: string, categoryId: string) => {
    setBudgetData(prev => {
      if (!prev) return null
      return {
        ...prev,
        categoryGroups: prev.categoryGroups.map(group =>
          group.id === groupId
            ? {
                ...group,
                categories: group.categories.filter(cat => cat.id !== categoryId)
              }
            : group
        )
      }
    })
  }

  const handleAddCategory = (groupId: string, newCategory: Category) => {
    setBudgetData(prev => {
      if (!prev) return null
      return {
        ...prev,
        categoryGroups: prev.categoryGroups.map(group =>
          group.id === groupId
            ? {
                ...group,
                categories: [...group.categories, newCategory]
              }
            : group
        )
      }
    })
  }

  const handleUpdateBudget = (categoryId: string, newAmount: number) => {
    setBudgetData(prev => {
      if (!prev) return null
      return {
        ...prev,
        categoryGroups: prev.categoryGroups.map(group => ({
          ...group,
          categories: group.categories.map(cat =>
            cat.id === categoryId ? { ...cat, budgeted: newAmount } : cat
          )
        }))
      }
    })
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  const getGroupTotals = (categories: Category[]) => {
    return categories.reduce(
      (totals, category) => ({
        budgeted: totals.budgeted + category.budgeted,
        activity: totals.activity + category.activity,
        available: totals.available + category.available,
      }),
      { budgeted: 0, activity: 0, available: 0 }
    )
  }

  if (loading) {
    return (
      <div className="flex-1 bg-white overflow-auto flex items-center justify-center">
        <div className="text-ynab-gray-500">Loading budget data...</div>
      </div>
    )
  }

  if (!budgetData) {
    return (
      <div className="flex-1 bg-white overflow-auto flex items-center justify-center">
        <div className="text-ynab-red">Failed to load budget data</div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-white overflow-auto">
      {/* Add Category Group Button - Now at the top */}
      <CategoryGroupEditor
        group={null}
        onUpdate={handleUpdateGroup}
        onDelete={handleDeleteGroup}
        onAdd={handleAddGroup}
      />

      {/* Table Header */}
      <div className="sticky top-0 bg-ynab-blue text-white px-6 py-3 grid grid-cols-4 gap-4 text-sm font-semibold">
        <div>Category</div>
        <div className="text-right">Budgeted</div>
        <div className="text-right">Activity</div>
        <div className="text-right">Available</div>
      </div>

      {/* Category Groups */}
      <div className="divide-y divide-ynab-gray-200">
        {budgetData.categoryGroups.map((group) => {
          const isExpanded = expandedGroups.includes(group.id)
          const totals = getGroupTotals(group.categories)

          return (
            <div key={group.id}>
              {/* Group Header with Editor */}
              <CategoryGroupEditor
                group={group}
                isExpanded={isExpanded}
                onToggle={toggleGroup}
                onUpdate={handleUpdateGroup}
                onDelete={handleDeleteGroup}
                onAdd={handleAddGroup}
              />

              {/* Categories */}
              {isExpanded && (
                <div className="divide-y divide-ynab-gray-200 group/category-list">
                  {group.categories.map((category) => (
                    <div
                      key={category.id}
                      className="px-6 py-3 hover:bg-ynab-gray-50 cursor-pointer grid grid-cols-4 gap-4 items-center group"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4" /> {/* Spacer for indent */}
                        <span className="text-ynab-gray-700">{category.name}</span>
                        <Target className="w-3 h-3 text-ynab-gray-400" />
                      </div>
                      <div className="text-right">
                        <BudgetAmountInput
                          categoryId={category.id}
                          initialAmount={category.budgeted}
                          onUpdate={handleUpdateBudget}
                        />
                      </div>
                      <div className={`text-right ${category.activity < 0 ? 'text-ynab-red' : 'text-ynab-green'}`}>
                        {formatCurrency(category.activity)}
                      </div>
                      <div className={`text-right font-medium ${
                        category.available > 0 ? 'text-ynab-green' : 
                        category.available < 0 ? 'text-ynab-red' : 'text-ynab-gray-600'
                      }`}>
                        {formatCurrency(category.available)}
                      </div>
                    </div>
                  ))}
                  
                  {/* Add Category Button - Blue circle that shows on category list hover */}
                  <CategoryEditor
                    category={null}
                    groupId={group.id}
                    onUpdate={(cat) => handleUpdateCategory(group.id, cat)}
                    onDelete={(catId) => handleDeleteCategory(group.id, catId)}
                    onAdd={(cat) => handleAddCategory(group.id, cat)}
                    showOnGroupHover={true}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
} 