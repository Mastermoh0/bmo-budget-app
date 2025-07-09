'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { ChevronDown, ChevronRight, Target, Plus } from 'lucide-react'
import { formatCurrency, getCurrentMonth } from '@/lib/utils'
import { CategoryGroupEditor } from './CategoryGroupEditor'
import { CategoryEditor } from './CategoryEditor'
import { BudgetAmountInput } from './BudgetAmountInput'
import { ContextMenu } from './ContextMenu'
import { NewCategoryInput } from './NewCategoryInput'
import { MoveCategoriesModal } from './move-categories-modal'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'

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

interface BudgetMainProps {
  selectedPlanId?: string
  showTargetPanel: boolean
  setShowTargetPanel: (show: boolean) => void
  selectedCategories: Set<string>
  setSelectedCategories: (categories: Set<string>) => void
  selectedGroups: Set<string>
  setSelectedGroups: (groups: Set<string>) => void
}

export function BudgetMain({ 
  selectedPlanId,
  showTargetPanel,
  setShowTargetPanel,
  selectedCategories,
  setSelectedCategories,
  selectedGroups,
  setSelectedGroups 
}: BudgetMainProps) {
  const router = useRouter()
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentMonth] = useState(getCurrentMonth())
  const [hiddenGroups, setHiddenGroups] = useState<Set<string>>(new Set())
  const [showHidden, setShowHidden] = useState(false)
  const [showQuickBudget, setShowQuickBudget] = useState(false)
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean
    position: { x: number; y: number }
    selectedCategories: Category[]
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    selectedCategories: []
  })
  
  // Move categories modal state
  const [showMoveModal, setShowMoveModal] = useState(false)
  
  // Confirmation dialog state
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean
    type: 'deleteCategory' | 'deleteGroup' | 'deleteSelectedCategories'
    title: string
    message: string
    onConfirm: () => void
    data?: any
  }>({
    isOpen: false,
    type: 'deleteCategory',
    title: '',
    message: '',
    onConfirm: () => {}
  })

  // Handle authentication/user errors by redirecting to sign-in
  const handleAuthError = async (error: string) => {
    console.log('Authentication error detected:', error)
    await signOut({
      callbackUrl: '/auth/signin',
      redirect: true
    })
  }

  // Confirmation dialog helpers
  const showConfirmationDialog = (type: 'deleteCategory' | 'deleteGroup' | 'deleteSelectedCategories', title: string, message: string, onConfirm: () => void, data?: any) => {
    setConfirmationDialog({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      data
    })
  }

  const closeConfirmationDialog = () => {
    setConfirmationDialog(prev => ({ ...prev, isOpen: false }))
  }

  // Fetch budget data from API
  const fetchBudgetData = async () => {
    try {
      const url = `/api/budgets?month=${currentMonth.toISOString()}${selectedPlanId ? `&planId=${selectedPlanId}` : ''}`
      console.log('🔍 BudgetMain: Fetching budget data from:', url)
      console.log('🔍 BudgetMain: selectedPlanId:', selectedPlanId)
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        console.log('✅ BudgetMain: Budget data received:', data)
        console.log('📊 BudgetMain: Category groups count:', data.categoryGroups?.length || 0)
        
        setBudgetData(data)
        // Auto-expand all groups initially
        setExpandedGroups(data.categoryGroups.map((group: CategoryGroup) => group.id))
      } else {
        const errorData = await response.json()
        console.error('❌ BudgetMain: Failed to fetch budget data - Status:', response.status)
        console.error('❌ BudgetMain: Error data:', errorData)
        
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
      console.error('❌ BudgetMain: Exception during fetch:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch budget data when component mounts or month/plan changes
  useEffect(() => {
    fetchBudgetData()
  }, [currentMonth, selectedPlanId])

  // Handler functions for category group operations
  const handleUpdateGroup = async (updatedGroup: CategoryGroup) => {
    try {
      const response = await fetch(`/api/categories/${updatedGroup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: updatedGroup.name }),
      })
      
      if (response.ok) {
        setBudgetData(prev => {
          if (!prev) return null
          return {
            ...prev,
            categoryGroups: prev.categoryGroups.map(group =>
              group.id === updatedGroup.id 
                ? {
                    ...group, // Preserve existing data including computed budget values
                    name: updatedGroup.name, // Only update the name
                    // Keep all other properties like categories with their budget data
                  }
                : group
            )
          }
        })
      } else {
        const errorData = await response.json()
        console.error('Failed to update group:', errorData)
        alert(`Failed to update group: ${errorData.error || 'Unknown error'}`)
        // Refresh data to revert local changes
        await fetchBudgetData()
      }
    } catch (error) {
      console.error('Failed to update group:', error)
      alert('Failed to update group. Please try again.')
      // Refresh data to revert local changes
      await fetchBudgetData()
    }
  }

  const handleDeleteGroup = (groupId: string) => {
    const group = budgetData?.categoryGroups.find(g => g.id === groupId)
    if (!group) return

    const categoryCount = group.categories.length
    const message = categoryCount > 0 
      ? `Are you sure you want to delete "${group.name}"? This will also delete all ${categoryCount} categor${categoryCount === 1 ? 'y' : 'ies'} in this group.`
      : `Are you sure you want to delete "${group.name}"?`

    showConfirmationDialog(
      'deleteGroup',
      'Delete Category Group',
      message,
      () => confirmDeleteGroup(groupId),
      { groupId, groupName: group.name }
    )
  }

  const confirmDeleteGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/categories/${groupId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setBudgetData(prev => {
          if (!prev) return null
          return {
            ...prev,
            categoryGroups: prev.categoryGroups.filter(group => group.id !== groupId)
          }
        })
        setExpandedGroups(prev => prev.filter(id => id !== groupId))
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
        
        console.error('Failed to delete group:', errorData)
        alert(`Failed to delete group: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to delete group:', error)
      alert('Failed to delete group. Please try again.')
    } finally {
      closeConfirmationDialog()
    }
  }

  const handleAddGroup = async (newGroup: CategoryGroup) => {
    // Expand the newly added group
    setExpandedGroups(prev => [...prev, newGroup.id])
    
    // Refresh budget data to get updated data from database
    await fetchBudgetData()
  }

  // Handler functions for category operations
  const handleUpdateCategory = async (groupId: string, updatedCategory: Category) => {
    try {
      const response = await fetch(`/api/categories/${groupId}/categories/${updatedCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: updatedCategory.name }),
      })
      
      if (response.ok) {
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
      } else {
        const errorData = await response.json()
        console.error('Failed to update category:', errorData)
        alert(`Failed to update category: ${errorData.error || 'Unknown error'}`)
        // Refresh data to revert local changes
        await fetchBudgetData()
      }
    } catch (error) {
      console.error('Failed to update category:', error)
      alert('Failed to update category. Please try again.')
      // Refresh data to revert local changes
      await fetchBudgetData()
    }
  }

  const handleDeleteCategory = (groupId: string, categoryId: string) => {
    const group = budgetData?.categoryGroups.find(g => g.id === groupId)
    const category = group?.categories.find(c => c.id === categoryId)
    if (!group || !category) return

    showConfirmationDialog(
      'deleteCategory',
      'Delete Category',
      `Are you sure you want to delete "${category.name}"?`,
      () => confirmDeleteCategory(groupId, categoryId),
      { groupId, categoryId, categoryName: category.name }
    )
  }

  const confirmDeleteCategory = async (groupId: string, categoryId: string) => {
    try {
      const response = await fetch(`/api/categories/${groupId}/categories/${categoryId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
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
      } else {
        const errorData = await response.json()
        console.error('Failed to delete category:', errorData)
        alert(`Failed to delete category: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to delete category:', error)
      alert('Failed to delete category. Please try again.')
    } finally {
      closeConfirmationDialog()
    }
  }

  const handleAddCategory = async (groupId: string, newCategory: Category) => {
    // Refresh budget data to get updated data from database with accurate computed values
    await fetchBudgetData()
  }

  const handleAddCategoryFromGroupButton = async (groupId: string, newCategory: Category) => {
    await handleAddCategory(groupId, newCategory)
  }

  const handleUpdateBudget = async (categoryId: string, newAmount: number) => {
    try {
      // Find the group that contains this category
      const group = budgetData?.categoryGroups.find(g => 
        g.categories.some(c => c.id === categoryId)
      )
      if (!group) return
      
      const response = await fetch(`/api/categories/${group.id}/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          budgeted: newAmount,
          month: currentMonth.toISOString()
        }),
      })
      
      if (response.ok) {
        setBudgetData(prev => {
          if (!prev) return null
          return {
            ...prev,
            categoryGroups: prev.categoryGroups.map(g => ({
              ...g,
              categories: g.categories.map(cat =>
                cat.id === categoryId ? { ...cat, budgeted: newAmount } : cat
              )
            }))
          }
        })
      } else {
        const errorData = await response.json()
        console.error('Failed to update budget:', errorData)
        alert(`Failed to update budget: ${errorData.error || 'Unknown error'}`)
        // Refresh data to revert local changes
        await fetchBudgetData()
      }
    } catch (error) {
      console.error('Failed to update budget:', error)
      alert('Failed to update budget. Please try again.')
      // Refresh data to revert local changes
      await fetchBudgetData()
    }
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

  // Context menu handlers
  const handleCategoryRightClick = (event: React.MouseEvent, category: Category) => {
    event.preventDefault()
    
    // If category is selected, show context menu for all selected categories
    const selectedCats = selectedCategories.has(category.id) 
      ? Array.from(selectedCategories).map(id => 
          budgetData?.categoryGroups.flatMap(g => g.categories).find(c => c.id === id)
        ).filter(Boolean) as Category[]
      : [category]
    
    setContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
      selectedCategories: selectedCats
    })
  }

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, isOpen: false }))
  }

  const handleMoveCategories = () => {
    setShowMoveModal(true)
  }

  const handleHideSelectedCategories = async () => {
    // Hide selected categories - you can implement this based on your needs
    console.log('Hiding categories:', contextMenu.selectedCategories.map(c => c.name))
    closeContextMenu()
  }

  const handleDeleteSelectedCategories = async () => {
    const count = contextMenu.selectedCategories.length
    const categoryNames = contextMenu.selectedCategories.map(c => c.name).join(', ')
    
    showConfirmationDialog(
      'deleteSelectedCategories',
      'Delete Selected Categories',
      `Are you sure you want to delete ${count} categor${count === 1 ? 'y' : 'ies'}?\n\n${categoryNames}`,
      () => confirmDeleteSelectedCategories()
    )
  }

  const confirmDeleteSelectedCategories = async () => {
    try {
      // Delete each selected category
      for (const category of contextMenu.selectedCategories) {
        // Find which group this category belongs to
        const group = budgetData?.categoryGroups.find(g => 
          g.categories.some(c => c.id === category.id)
        )
        if (group) {
          const response = await fetch(`/api/categories/${group.id}/categories/${category.id}`, {
            method: 'DELETE',
          })
          
          if (response.ok) {
            // Update local state only if API call was successful
            setBudgetData(prev => {
              if (!prev) return null
              return {
                ...prev,
                categoryGroups: prev.categoryGroups.map(g =>
                  g.id === group.id
                    ? {
                        ...g,
                        categories: g.categories.filter(cat => cat.id !== category.id)
                      }
                    : g
                )
              }
            })
            
            // Also remove from selected categories
            const newSelected = new Set(selectedCategories)
            newSelected.delete(category.id)
            setSelectedCategories(newSelected)
          } else {
            const errorData = await response.json()
            console.error(`Failed to delete category ${category.name}:`, errorData)
            alert(`Failed to delete category "${category.name}": ${errorData.error || 'Unknown error'}`)
            break // Stop deletion process if one fails
          }
        }
      }
    } catch (error) {
      console.error('Failed to delete categories:', error)
      alert('Failed to delete categories. Please try again.')
    } finally {
      closeContextMenu()
      closeConfirmationDialog()
    }
  }

  const handleMoveCategoriesConfirm = async (targetGroupId: string) => {
    try {
      // Move each selected category
      for (const category of contextMenu.selectedCategories) {
        const response = await fetch(`/api/categories/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryId: category.id,
            targetGroupId: targetGroupId
          })
        })
        
        if (!response.ok) {
          throw new Error('Failed to move category')
        }
      }
      
      // Refresh budget data
      await fetchBudgetData()
      
      // Clear selections
      setSelectedCategories(new Set())
      closeContextMenu()
    } catch (error) {
      console.error('Failed to move categories:', error)
      throw error
    }
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
      <div className="sticky top-0 z-10 bg-ynab-blue text-white px-6 py-3 grid grid-cols-4 gap-4 text-sm font-semibold shadow-sm">
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
                onAddCategory={handleAddCategoryFromGroupButton}
              />

              {/* Categories */}
              {isExpanded && (
                <div className="divide-y divide-ynab-gray-200 group/category-list">
                  {group.categories.map((category) => (
                    <div
                      key={category.id}
                      className="px-6 py-3 hover:bg-ynab-gray-50 cursor-pointer grid grid-cols-4 gap-4 items-center group"
                      onContextMenu={(e) => handleCategoryRightClick(e, category)}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-ynab-blue bg-gray-100 border-gray-300 rounded focus:ring-ynab-blue focus:ring-2"
                            checked={selectedCategories.has(category.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedCategories)
                              if (e.target.checked) {
                                newSelected.add(category.id)
                              } else {
                                newSelected.delete(category.id)
                              }
                              setSelectedCategories(newSelected)
                            }}
                          />
                        </div>
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

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeContextMenu}
        onHide={handleHideSelectedCategories}
        onDelete={handleDeleteSelectedCategories}
        onSetTarget={() => {/* TODO: Implement set target */}}
        onBulkEdit={() => {/* TODO: Implement bulk edit */}}
        onBulkDelete={handleDeleteSelectedCategories}
        onMove={handleMoveCategories}
        onClearSelections={() => {
          setSelectedCategories(new Set())
          closeContextMenu()
        }}
        itemName=""
        itemType="category"
        selectedCount={contextMenu.selectedCategories.length}
      />

      {/* Move Categories Modal */}
      <MoveCategoriesModal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        selectedCategories={contextMenu.selectedCategories}
        availableGroups={budgetData?.categoryGroups.filter(group => 
          !contextMenu.selectedCategories.some(cat => 
            group.categories.some(c => c.id === cat.id)
          )
        ) || []}
        onMove={handleMoveCategoriesConfirm}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationDialog.isOpen}
        onClose={closeConfirmationDialog}
        onConfirm={confirmationDialog.onConfirm}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  )
} 