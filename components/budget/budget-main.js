'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Target, Plus, Edit3, Check, X, EyeOff, Trash2 } from 'lucide-react'
import { formatCurrency, getCurrentMonth, formatMonthYear } from '@/lib/utils'
import { CategoryGroupEditor } from './CategoryGroupEditor'
import { CategoryEditor } from './CategoryEditor'
import { BudgetAmountInput } from './BudgetAmountInput'
import { NewCategoryInput } from './NewCategoryInput'
import { ContextMenu } from './ContextMenu'
import { QuickBudgetPanel } from './quick-budget-panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function BudgetMain({ selectedPlanId, showTargetPanel, setShowTargetPanel, selectedCategories, setSelectedCategories, selectedGroups, setSelectedGroups }) {
  const [expandedGroups, setExpandedGroups] = useState([])
  const [budgetData, setBudgetData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentMonth] = useState(getCurrentMonth())
  const [showingInputForGroup, setShowingInputForGroup] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    item: null,
    itemType: null
  })
  const [hiddenCategories, setHiddenCategories] = useState(new Set())
  const [hiddenGroups, setHiddenGroups] = useState(new Set())
  const [showHidden, setShowHidden] = useState(false)
  const [showQuickBudget, setShowQuickBudget] = useState(false)
  
  // Selection state for bulk actions
  // Always show checkboxes - no selection mode needed

  // Fetch budget data from API
  const fetchBudgetData = async () => {
    if (!selectedPlanId) {
      setLoading(false)
      return
    }
    
    try {
      const url = `/api/budgets?month=${currentMonth.toISOString()}&planId=${selectedPlanId}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setBudgetData(data)
        // Auto-expand all groups initially
        setExpandedGroups(data.categoryGroups.map(group => group.id))
      } else {
        console.error('Failed to fetch budget data:', response.status)
        setBudgetData(null)
      }
    } catch (error) {
      console.error('Failed to fetch budget data:', error)
      setBudgetData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Reset loading state when plan changes
    if (selectedPlanId) {
      setLoading(true)
    }
    fetchBudgetData()
  }, [currentMonth, selectedPlanId])

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  const getGroupTotals = (categories) => {
    return categories.reduce(
      (totals, category) => ({
        budgeted: totals.budgeted + category.budgeted,
        activity: totals.activity + category.activity,
        available: totals.available + category.available,
      }),
      { budgeted: 0, activity: 0, available: 0 }
    )
  }

  // Handle category group updates
  const handleGroupUpdate = (updatedGroup) => {
    setBudgetData(prev => ({
      ...prev,
      categoryGroups: prev.categoryGroups.map(group =>
        group.id === updatedGroup.id ? updatedGroup : group
      )
    }))
  }

  const handleGroupDelete = (groupId) => {
    setBudgetData(prev => ({
      ...prev,
      categoryGroups: prev.categoryGroups.filter(group => group.id !== groupId)
    }))
    setExpandedGroups(prev => prev.filter(id => id !== groupId))
  }

  const handleGroupAdd = (newGroup) => {
    console.log('Adding new group to budget data:', newGroup)
    setBudgetData(prev => {
      if (!prev) {
        // If no budget data yet, create initial structure
        return {
          month: new Date(),
          toBeBudgeted: 0,
          totalBudgeted: 0,
          totalActivity: 0,
          totalAvailable: 0,
          totalIncome: 0,
          categoryGroups: [newGroup]
        }
      }
      return {
        ...prev,
        categoryGroups: [...prev.categoryGroups, newGroup]
      }
    })
    setExpandedGroups(prev => [...prev, newGroup.id])
    
    // Refresh budget data from server to ensure consistency
    setTimeout(() => {
      fetchBudgetData()
    }, 500)
  }

  // Handle category updates
  const handleCategoryUpdate = (groupId, updatedCategory) => {
    setBudgetData(prev => ({
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
    }))
  }

  const handleCategoryDelete = (groupId, categoryId) => {
    setBudgetData(prev => ({
      ...prev,
      categoryGroups: prev.categoryGroups.map(group =>
        group.id === groupId
          ? {
              ...group,
              categories: group.categories.filter(cat => cat.id !== categoryId)
            }
          : group
      )
    }))
  }

  const handleCategoryAdd = (groupId, newCategory) => {
    setBudgetData(prev => ({
      ...prev,
      categoryGroups: prev.categoryGroups.map(group =>
        group.id === groupId
          ? {
              ...group,
              categories: [...group.categories, newCategory]
            }
          : group
      )
    }))
  }

  // Handle budget amount updates
  const handleBudgetUpdate = (categoryId, newAmount, updatedCategory = null) => {
    if (updatedCategory) {
      // New interface - update the entire category with API response
      setBudgetData(prev => ({
        ...prev,
        categoryGroups: prev.categoryGroups.map(group => ({
          ...group,
          categories: group.categories.map(cat =>
            cat.id === categoryId ? {
              ...cat,
              budgeted: updatedCategory.budgeted || newAmount,
              activity: updatedCategory.activity || cat.activity,
              available: updatedCategory.available || ((updatedCategory.budgeted || newAmount) + cat.activity)
            } : cat
          )
        }))
      }))
    } else {
      // Old interface - simple amount update
      setBudgetData(prev => ({
        ...prev,
        categoryGroups: prev.categoryGroups.map(group => ({
          ...group,
          categories: group.categories.map(cat =>
            cat.id === categoryId
              ? { ...cat, budgeted: newAmount, available: newAmount + cat.activity }
              : cat
          )
        }))
      }))
    }

    // Recalculate "To Be Budgeted" amount for both interfaces
    setBudgetData(prev => {
      const totalBudgeted = prev.categoryGroups.reduce((total, group) =>
        total + group.categories.reduce((catTotal, cat) => catTotal + (cat.budgeted || 0), 0), 0
      )
      return {
        ...prev,
        totalBudgeted,
        toBeBudgeted: (prev.totalIncome || 0) - totalBudgeted
      }
    })
  }

  // Handle bulk budget assignments from templates
  const handleApplyBudgetTemplate = async (assignments) => {
    try {
      // Apply assignments to local state for immediate UI update
      setBudgetData(prev => {
        const updated = { ...prev }
        
        assignments.forEach(({ categoryId, amount }) => {
          updated.categoryGroups = updated.categoryGroups.map(group => ({
            ...group,
            categories: group.categories.map(cat =>
              cat.id === categoryId
                ? { ...cat, budgeted: amount, available: amount + cat.activity }
                : cat
            )
          }))
        })
        
        // Recalculate totals
        const totalBudgeted = updated.categoryGroups.reduce((total, group) =>
          total + group.categories.reduce((catTotal, cat) => catTotal + cat.budgeted, 0), 0
        )
        
        return {
          ...updated,
          totalBudgeted,
          toBeBudgeted: Math.max(0, (updated.totalIncome || 5000) - totalBudgeted)
        }
      })

      // Send updates to server using the existing budget API endpoint
      const updatePromises = assignments.map(({ categoryId, amount }) =>
        fetch(`/api/budgets/${categoryId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            budgeted: amount,
            month: currentMonth.toISOString(),
            groupId: selectedPlanId // Use the plan ID as the group ID
          })
        })
      )

      const responses = await Promise.all(updatePromises)
      
      // Check for any failed requests
      const failedUpdates = responses.filter(response => !response.ok)
      if (failedUpdates.length > 0) {
        console.error(`${failedUpdates.length} budget updates failed`)
        // Don't throw, let partial success stand
      }
      
      // Refresh data from server to ensure consistency
      await fetchBudgetData()
      
    } catch (error) {
      console.error('Failed to apply budget template:', error)
      // Refresh data to revert any partial changes
      await fetchBudgetData()
      throw error // Re-throw so the UI can show an error message
    }
  }

  // Selection handlers - checkboxes always visible
  const clearAllSelections = () => {
    setSelectedCategories(new Set())
    setSelectedGroups(new Set())
  }

  const toggleCategorySelection = (categoryId) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const toggleGroupSelection = (groupId) => {
    setSelectedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) {
        newSet.delete(groupId)
      } else {
        newSet.add(groupId)
      }
      return newSet
    })
  }

  const selectAllInGroup = (groupId) => {
    const group = budgetData.categoryGroups.find(g => g.id === groupId)
    if (!group) return
    
    setSelectedCategories(prev => {
      const newSet = new Set(prev)
      group.categories.forEach(cat => newSet.add(cat.id))
      return newSet
    })
  }

  const getSelectedCount = () => {
    return selectedCategories.size + selectedGroups.size
  }

  // Bulk action handlers
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${getSelectedCount()} selected items?`)) {
      return
    }
    
    // TODO: Implement bulk delete API calls
    console.log('Bulk delete:', { categories: [...selectedCategories], groups: [...selectedGroups] })
  }

  const handleBulkEdit = () => {
    // TODO: Implement bulk edit modal
    console.log('Bulk edit:', { categories: [...selectedCategories], groups: [...selectedGroups] })
  }

  const handleBulkSetTarget = () => {
    setShowTargetPanel(true)
    console.log('Bulk set target:', { categories: [...selectedCategories], groups: [...selectedGroups] })
  }

  // Handle add category button click
  const handleAddCategoryClick = (groupId) => {
    setShowingInputForGroup(groupId)
  }

  // Handle category creation
  const handleCreateCategory = async (categoryName, groupId) => {
    try {
      const response = await fetch(`/api/categories/${groupId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName }),
      })
      
      if (response.ok) {
        const newCategory = await response.json()
        handleCategoryAdd(groupId, newCategory)
        setShowingInputForGroup(null)
      } else {
        throw new Error('Failed to create category')
      }
    } catch (error) {
      console.error('Failed to create category:', error)
      throw error // Re-throw so the component can handle the error
    }
  }

  // Handle input cancel
  const handleCancelCategoryInput = () => {
    setShowingInputForGroup(null)
  }

  // Handle category name editing
  const handleStartEditCategory = (categoryId, currentName) => {
    setEditingCategory(categoryId)
    setEditCategoryName(currentName)
  }

  const handleSaveCategoryName = async (groupId, categoryId) => {
    if (!editCategoryName.trim()) return

    try {
      const response = await fetch(`/api/categories/${groupId}/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editCategoryName.trim() }),
      })

      if (response.ok) {
        const updatedCategory = await response.json()
        
        // Update the category in our local state
        setBudgetData(prevData => ({
          ...prevData,
          categoryGroups: prevData.categoryGroups.map(group =>
            group.id === groupId
              ? {
                  ...group,
                  categories: group.categories.map(cat =>
                    cat.id === categoryId ? { ...cat, name: updatedCategory.name } : cat
                  )
                }
              : group
          )
        }))
        
        setEditingCategory(null)
        setEditCategoryName('')
      }
    } catch (error) {
      console.error('Failed to update category name:', error)
    }
  }

  const handleCancelCategoryEdit = () => {
    setEditingCategory(null)
    setEditCategoryName('')
  }

  // Context menu handlers
  const handleRightClick = (e, item, itemType) => {
    e.preventDefault()
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      item,
      itemType
    })
  }

  const closeContextMenu = () => {
    setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, item: null, itemType: null })
  }

  const handleHideItem = () => {
    if (contextMenu.itemType === 'category') {
      setHiddenCategories(prev => new Set([...prev, contextMenu.item.id]))
    } else if (contextMenu.itemType === 'group') {
      setHiddenGroups(prev => new Set([...prev, contextMenu.item.id]))
    }
  }

  const handleUnhideItem = (itemId, itemType) => {
    if (itemType === 'category') {
      setHiddenCategories(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    } else if (itemType === 'group') {
      setHiddenGroups(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  const handleDeleteFromContext = async () => {
    if (contextMenu.itemType === 'category') {
      const groupId = findGroupIdForCategory(contextMenu.item.id)
      if (groupId) {
        await handleDeleteCategory(groupId, contextMenu.item.id)
      }
    } else if (contextMenu.itemType === 'group') {
      await handleGroupDelete(contextMenu.item.id)
    }
  }

  // Helper function to find which group a category belongs to
  const findGroupIdForCategory = (categoryId) => {
    for (const group of budgetData.categoryGroups) {
      if (group.categories.some(cat => cat.id === categoryId)) {
        return group.id
      }
    }
    return null
  }

  // Enhanced delete category function
  const handleDeleteCategory = async (groupId, categoryId) => {
    if (!confirm(`Are you sure you want to delete this category?`)) {
      return
    }

    try {
      const response = await fetch(`/api/categories/${groupId}/categories/${categoryId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setBudgetData(prevData => ({
          ...prevData,
          categoryGroups: prevData.categoryGroups.map(group =>
            group.id === groupId
              ? {
                  ...group,
                  categories: group.categories.filter(cat => cat.id !== categoryId)
                }
              : group
          )
        }))
      }
    } catch (error) {
      console.error('Failed to delete category:', error)
    }
  }

  if (!selectedPlanId) {
    return (
      <div className="flex-1 bg-white overflow-auto flex items-center justify-center">
        <div className="text-center">
          <div className="text-ynab-gray-500 mb-2">No plan selected</div>
          <div className="text-sm text-ynab-gray-400">Please select a plan from the dropdown above</div>
        </div>
      </div>
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

  // Check if user has no category groups (empty budget)
  if (budgetData.categoryGroups && budgetData.categoryGroups.length === 0) {
    return (
      <div className="flex-1 bg-white overflow-auto">
        {/* Table Header */}
        <div className="sticky top-0 bg-ynab-blue text-white px-6 py-3 grid grid-cols-4 gap-4 text-sm font-semibold">
          <div>Category</div>
          <div className="text-right">Budgeted</div>
          <div className="text-right">Activity</div>
          <div className="text-right">Available</div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center py-32">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <div className="w-24 h-24 bg-ynab-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-12 h-12 text-ynab-gray-400" />
              </div>
              <h2 className="text-2xl font-semibold text-ynab-gray-800 mb-2">
                Start Your Budget
              </h2>
              <p className="text-ynab-gray-600 mb-6">
                Create your first category group to organize your budget. 
                Category groups help you group related expenses together.
              </p>
            </div>
            
            <CategoryGroupEditor
              group={null}
              onUpdate={handleGroupUpdate}
              onDelete={handleGroupDelete}
              onAdd={handleGroupAdd}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-white overflow-auto">
      {/* Budget Summary Header */}
      <div className="bg-ynab-blue text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {formatMonthYear(currentMonth)} Budget
            </h2>
            <p className="text-ynab-gray-200 text-sm">
              Plan your spending for this month
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-ynab-gray-200">To Be Budgeted</div>
            <div className={`text-2xl font-bold ${
              (budgetData?.toBeBudgeted || 0) > 0 ? 'text-white' : 
              (budgetData?.toBeBudgeted || 0) < 0 ? 'text-ynab-yellow' : 'text-ynab-gray-300'
            }`}>
              {formatCurrency(budgetData?.toBeBudgeted || 0)}
            </div>
            {(budgetData?.toBeBudgeted || 0) < 0 && (
              <div className="text-xs text-ynab-yellow mt-1">
                You've budgeted more than you have!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Category Group Button - Now at the top */}
      <CategoryGroupEditor
        group={null}
        onUpdate={handleGroupUpdate}
        onDelete={handleGroupDelete}
        onAdd={handleGroupAdd}
        planId={selectedPlanId}
      />

      {/* Table Header */}
      <div className="sticky top-0 bg-ynab-blue text-white px-6 py-3 text-sm font-semibold">
        <div className="grid gap-4 items-center" style={{ gridTemplateColumns: '50px 1fr 140px 140px 140px' }}>
          <div className="flex items-center">
            <input
              type="checkbox"
              className="rounded text-blue-600"
              onChange={(e) => {
                if (e.target.checked) {
                  // Select all visible categories and groups
                  const allCategories = budgetData.categoryGroups.flatMap(g => g.categories.map(c => c.id))
                  const allGroups = budgetData.categoryGroups.map(g => g.id)
                  setSelectedCategories(new Set(allCategories))
                  setSelectedGroups(new Set(allGroups))
                } else {
                  clearAllSelections()
                }
              }}
              checked={getSelectedCount() > 0 && getSelectedCount() === (budgetData?.categoryGroups?.flatMap(g => g.categories).length || 0) + (budgetData?.categoryGroups?.length || 0)}
            />
          </div>
          <div>Category</div>
          <div className="text-right">Budgeted</div>
          <div className="text-right">Activity</div>
          <div className="text-right">Available</div>
        </div>
      </div>

      {/* Hidden Items Toggle */}
      {(hiddenGroups.size > 0 || hiddenCategories.size > 0) && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHidden(!showHidden)}
            className="text-gray-600 hover:text-gray-800"
          >
            <EyeOff className="w-4 h-4 mr-2" />
            {showHidden ? 'Hide' : 'Show'} Hidden Items ({hiddenGroups.size + hiddenCategories.size})
          </Button>
        </div>
      )}

      {/* Hidden Items Section */}
      {showHidden && (hiddenGroups.size > 0 || hiddenCategories.size > 0) && (
        <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-200">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Hidden Items</h3>
          
          {/* Hidden Groups */}
          {Array.from(hiddenGroups).map(groupId => {
            const group = budgetData.categoryGroups.find(g => g.id === groupId)
            return group ? (
              <div key={groupId} className="flex items-center justify-between py-1">
                <span className="text-sm text-yellow-700">Group: {group.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnhideItem(groupId, 'group')}
                  className="text-yellow-600 hover:text-yellow-800"
                >
                  Unhide
                </Button>
              </div>
            ) : null
          })}
          
          {/* Hidden Categories */}
          {Array.from(hiddenCategories).map(categoryId => {
            let category = null
            let groupName = ''
            for (const group of budgetData.categoryGroups) {
              const foundCategory = group.categories.find(c => c.id === categoryId)
              if (foundCategory) {
                category = foundCategory
                groupName = group.name
                break
              }
            }
            return category ? (
              <div key={categoryId} className="flex items-center justify-between py-1">
                <span className="text-sm text-yellow-700">Category: {category.name} (in {groupName})</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnhideItem(categoryId, 'category')}
                  className="text-yellow-600 hover:text-yellow-800"
                >
                  Unhide
                </Button>
              </div>
            ) : null
          })}
        </div>
      )}

      {/* Category Groups */}
      <div className="divide-y divide-ynab-gray-200">
        {budgetData.categoryGroups.filter(group => showHidden || !hiddenGroups.has(group.id)).map((group) => {
          const isExpanded = expandedGroups.includes(group.id)
          const totals = getGroupTotals(group.categories)

          return (
            <div key={group.id}>
              {/* Group Header with Editor */}
              <div 
                onContextMenu={(e) => handleRightClick(e, group, 'group')}
                className={hiddenGroups.has(group.id) ? 'opacity-50 bg-red-50' : ''}
              >
                <CategoryGroupEditor
                  group={group}
                  isExpanded={isExpanded}
                  onToggle={toggleGroup}
                  onUpdate={handleGroupUpdate}
                  onDelete={handleGroupDelete}
                  onAdd={handleGroupAdd}
                  onAddCategory={() => handleAddCategoryClick(group.id)}
                  planId={selectedPlanId}
                  isSelected={selectedGroups.has(group.id)}
                  onToggleSelection={() => toggleGroupSelection(group.id)}
                  onSelectAll={() => selectAllInGroup(group.id)}
                />
              </div>

              {/* Add Category Input - Shows when this group is selected for input */}
              {showingInputForGroup === group.id && (
                <NewCategoryInput
                  onCancel={handleCancelCategoryInput}
                  onCreate={(categoryName) => handleCreateCategory(categoryName, group.id)}
                />
              )}

              {/* Categories */}
              {isExpanded && (
                <div className="divide-y divide-ynab-gray-200">
                  {group.categories.filter(category => showHidden || !hiddenCategories.has(category.id)).map((category) => (
                    <div
                      key={category.id}
                      className={`px-6 py-3 hover:bg-ynab-gray-50 items-center group grid gap-4 ${
                        hiddenCategories.has(category.id) ? 'opacity-50 bg-red-50' : ''
                      }`}
                      style={{ gridTemplateColumns: '50px 1fr 140px 140px 140px' }}
                      onContextMenu={(e) => handleRightClick(e, category, 'category')}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded text-blue-600"
                          checked={selectedCategories.has(category.id)}
                          onChange={() => toggleCategorySelection(category.id)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4" /> {/* Spacer for indent */}
                          {editingCategory === category.id ? (
                            <Input
                              type="text"
                              value={editCategoryName}
                              onChange={(e) => setEditCategoryName(e.target.value)}
                              className="flex-1 text-sm h-8"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveCategoryName(group.id, category.id)
                                if (e.key === 'Escape') handleCancelCategoryEdit()
                              }}
                              onBlur={() => handleSaveCategoryName(group.id, category.id)}
                            />
                          ) : (
                            <span 
                              className="text-ynab-gray-700 cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => handleStartEditCategory(category.id, category.name)}
                              title="Click to edit category name"
                            >
                              {category.name}
                            </span>
                          )}
                          <Target className="w-3 h-3 text-ynab-gray-400" />
                        </div>
                        
                        {/* Edit controls that appear on hover */}
                        {editingCategory === category.id ? (
                          <div className="flex items-center space-x-1">
                            <Button
                              onClick={() => handleSaveCategoryName(group.id, category.id)}
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-green-600 hover:bg-green-100 hover:text-green-700"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={handleCancelCategoryEdit}
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-gray-500 hover:bg-gray-100"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              onClick={() => handleStartEditCategory(category.id, category.name)}
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-gray-500 hover:text-blue-600 hover:bg-white"
                              title="Edit category name"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <BudgetAmountInput
                          categoryId={category.id}
                          initialAmount={category.budgeted}
                          onUpdate={handleBudgetUpdate}
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
        onHide={handleHideItem}
        onDelete={handleDeleteFromContext}
        onSetTarget={handleBulkSetTarget}
        onBulkEdit={handleBulkEdit}
        onBulkDelete={handleBulkDelete}
        onClearSelections={clearAllSelections}
        itemName={contextMenu.item?.name || ''}
        itemType={contextMenu.itemType}
        selectedCount={getSelectedCount()}
      />

      {/* Quick Budget Panel */}
      <QuickBudgetPanel
        isOpen={showQuickBudget}
        onToggle={() => setShowQuickBudget(!showQuickBudget)}
        budgetData={budgetData}
        onApplyBudget={handleApplyBudgetTemplate}
        availableToAssign={budgetData?.toBeBudgeted || 0}
      />
    </div>
  )
} 