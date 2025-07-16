'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { BudgetHeader } from '@/components/budget/budget-header'
import { BudgetMain } from '@/components/budget/budget-main.tsx'
import { QuickBudgetPanel } from '@/components/budget/quick-budget-panel'
import { QuickBudgetToggleButton } from '@/components/budget/quick-budget-toggle-button'
import { TargetPanel } from '@/components/budget/target-panel'
import { TargetToggleButton } from '@/components/budget/target-toggle-button'
import { NotesPanel } from '@/components/budget/notes-panel'
import { NotesToggleButton } from '@/components/budget/notes-toggle-button'

export default function Home() {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [hasAutoSelected, setHasAutoSelected] = useState(false)
  const [showTargetPanel, setShowTargetPanel] = useState(false)
  const [showNotesPanel, setShowNotesPanel] = useState(false)
  const [showQuickBudget, setShowQuickBudget] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [budgetData, setBudgetData] = useState<any>(null)
  const [availableToAssign, setAvailableToAssign] = useState(0)
  const [refreshTrigger, setRefreshTrigger] = useState(0) // Add refresh trigger
  const searchParams = useSearchParams()
  const router = useRouter()

  // Check if a plan ID is provided in the URL, or auto-select last used plan
  useEffect(() => {
    const planId = searchParams.get('plan')
    if (planId) {
      setSelectedPlanId(planId)
      setHasAutoSelected(true)
      // Save to localStorage
      localStorage.setItem('lastSelectedPlan', planId)
    } else if (!hasAutoSelected) {
      // No URL parameter, check localStorage for last selected plan
      const lastSelectedPlan = localStorage.getItem('lastSelectedPlan')
      if (lastSelectedPlan) {
        console.log('🔄 Restoring last selected plan from localStorage:', lastSelectedPlan)
        setSelectedPlanId(lastSelectedPlan)
        setHasAutoSelected(true)
        
        // Update URL to reflect the restored plan
        const newSearchParams = new URLSearchParams(searchParams)
        newSearchParams.set('plan', lastSelectedPlan)
        router.replace(`/?${newSearchParams.toString()}`)
      } else {
        // No saved plan, fetch user's plans and auto-select first one
        fetchUserPlansAndAutoSelect()
      }
    }
  }, [searchParams, hasAutoSelected])

  const fetchUserPlansAndAutoSelect = async () => {
    try {
      console.log('🔍 Home: Fetching user plans for auto-selection')
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Home: User profile data:', data)
        console.log('📋 Home: Available budgets:', data.budgets?.length || 0)
        
        if (data.budgets && data.budgets.length > 0) {
          const firstPlanId = data.budgets[0].id
          console.log('🎯 Home: Auto-selecting first plan:', firstPlanId, data.budgets[0].name)
          setSelectedPlanId(firstPlanId)
          setHasAutoSelected(true)
          
          // Save to localStorage
          localStorage.setItem('lastSelectedPlan', firstPlanId)
          
          // Update URL to reflect the auto-selected plan
          const newSearchParams = new URLSearchParams(searchParams)
          newSearchParams.set('plan', firstPlanId)
          router.replace(`/?${newSearchParams.toString()}`)
        } else {
          console.log('⚠️ Home: No budgets found for user')
        }
      } else {
        console.error('❌ Home: Failed to fetch user profile - Status:', response.status)
      }
    } catch (error) {
      console.error('❌ Home: Exception during plan fetch:', error)
    }
  }

  const handlePlanChange = (planId: string) => {
    console.log('🔄 Home: Plan changing from', selectedPlanId, 'to', planId)
    
    // Clear budget data immediately to prevent stale data issues
    setBudgetData(null)
    setAvailableToAssign(0)
    
    setSelectedPlanId(planId)
    
    // Save to localStorage
    localStorage.setItem('lastSelectedPlan', planId)
    
    // Update URL with the selected plan
    const newSearchParams = new URLSearchParams(searchParams)
    newSearchParams.set('plan', planId)
    router.push(`/?${newSearchParams.toString()}`)
  }

  // Handle applying budget template from Quick Budget
  const handleApplyBudget = async (assignments: { categoryId: string, amount: number }[]) => {
    try {
      console.log('🚀 Quick Budget: Applying template with assignments:', assignments)
      console.log('📊 Quick Budget: Current budget data:', budgetData)
      
      // Apply each budget assignment
      for (const assignment of assignments) {
        // Find the group that contains this category
        const group = budgetData?.categoryGroups.find((g: any) => 
          g.categories.some((c: any) => c.id === assignment.categoryId)
        )
        
        if (!group) {
          console.error(`❌ Quick Budget: Could not find group for category ID: ${assignment.categoryId}`)
          throw new Error(`Could not find category group for category ${assignment.categoryId}`)
        }
        
        console.log(`💰 Quick Budget: Updating category ${assignment.categoryId} to ${assignment.amount} in group ${group.id}`)
        
        const response = await fetch(`/api/categories/${group.id}/categories/${assignment.categoryId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            budgeted: assignment.amount,
            month: new Date().toISOString(),
            planId: selectedPlanId // Add planId to ensure we're updating the right plan
          }),
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error(`❌ Quick Budget: API error for category ${assignment.categoryId}:`, errorData)
          throw new Error(`Failed to update category ${assignment.categoryId}: ${errorData.error || 'Unknown error'}`)
        }
        
        console.log(`✅ Quick Budget: Successfully updated category ${assignment.categoryId}`)
      }
      
      console.log('🎉 Quick Budget: All assignments applied successfully!')
      
      // Wait a moment for database updates to complete, then trigger refresh
      setTimeout(() => {
        console.log('🔄 Quick Budget: Triggering data refresh via event')
        window.dispatchEvent(new CustomEvent('refreshBudgetData'))
        console.log('🔄 Quick Budget: Event dispatched, listeners should receive it now')
      }, 500) // 500ms delay to ensure all DB updates are complete
      
    } catch (error) {
      console.error('Failed to apply budget template:', error)
      alert(`Failed to apply budget template: ${error.message}`)
      throw error
    }
  }

  // Function to force data refresh
  const handleForceRefresh = () => {
    console.log('🔄 Home: Forcing budget data refresh')
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <>
      {/* Header */}
      <BudgetHeader 
        selectedPlanId={selectedPlanId}
        onPlanChange={handlePlanChange}
      />
      
      {/* Budget Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <BudgetMain 
          selectedPlanId={selectedPlanId}
          showTargetPanel={showTargetPanel}
          setShowTargetPanel={setShowTargetPanel}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          selectedGroups={selectedGroups}
          setSelectedGroups={setSelectedGroups}
          onBudgetDataChange={(data) => {
            console.log('🔄 Home: Budget data updated, plan info:', {
              selectedPlanId,
              categoryGroupsCount: data?.categoryGroups?.length,
              firstGroupId: data?.categoryGroups?.[0]?.groupId,
              sampleCategoryId: data?.categoryGroups?.[0]?.categories?.[0]?.id
            })
            setBudgetData(data)
          }}
          onAvailableToAssignChange={setAvailableToAssign}
          refreshTrigger={refreshTrigger}
        />
        <QuickBudgetPanel 
          isOpen={showQuickBudget}
          onToggle={() => setShowQuickBudget(!showQuickBudget)}
          budgetData={budgetData}
          onApplyBudget={handleApplyBudget}
          availableToAssign={availableToAssign}
          onRefreshData={handleForceRefresh}
        />
        <QuickBudgetToggleButton
          isOpen={showQuickBudget}
          onToggle={() => setShowQuickBudget(!showQuickBudget)}
        />
        <TargetToggleButton
          isOpen={showTargetPanel}
          onToggle={() => setShowTargetPanel(!showTargetPanel)}
        />
        <NotesToggleButton
          isOpen={showNotesPanel}
          onToggle={() => setShowNotesPanel(!showNotesPanel)}
        />
        <TargetPanel
          isVisible={showTargetPanel}
          onClose={() => setShowTargetPanel(false)}
          selectedCategories={selectedCategories}
          selectedGroups={selectedGroups}
          planId={selectedPlanId}
        />
        <NotesPanel
          isVisible={showNotesPanel}
          onClose={() => setShowNotesPanel(false)}
          selectedCategories={selectedCategories}
          selectedGroups={selectedGroups}
          planId={selectedPlanId}
        />
      </div>
    </>
  )
} 