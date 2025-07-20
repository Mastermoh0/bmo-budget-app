'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getCurrentMonth } from '@/lib/utils'
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
  
  // Month state management - moved from header to parent
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth())
  
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

  // Handle plan changes from URL parameters
  useEffect(() => {
    const planFromUrl = searchParams.get('plan')
    if (planFromUrl && planFromUrl !== selectedPlanId) {
      setSelectedPlanId(planFromUrl)
      localStorage.setItem('lastSelectedPlan', planFromUrl)
    } else if (!planFromUrl && !hasAutoSelected) {
      // Auto-select last plan from localStorage if no plan in URL
      const lastPlan = localStorage.getItem('lastSelectedPlan')
      if (lastPlan) {
        setSelectedPlanId(lastPlan)
        setHasAutoSelected(true)
      }
    }
  }, [searchParams, selectedPlanId, hasAutoSelected])

  // Handle plan selection
  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId)
    localStorage.setItem('lastSelectedPlan', planId)
    
    // Update URL with plan parameter
    const params = new URLSearchParams(searchParams.toString())
    params.set('plan', planId)
    router.replace(`/?${params.toString()}`)
  }

  // Handle month navigation
  const handleMonthChange = (newMonth: Date) => {
    console.log('🗓️ Month changed to:', newMonth)
    setCurrentMonth(newMonth)
  }

  // Handle QuickBudget actions
  const handleApplyBudget = async (targetData: any) => {
    try {
      console.log('💡 QuickBudget: Applying target data:', targetData)
      
      const requests = targetData.map((target: any) => {
        const budget = target.suggestedAmount || target.amount || 0
        return fetch(`/api/categories/${target.groupId}/categories/${target.categoryId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            budgeted: budget,
            month: currentMonth.toISOString(),
            planId: selectedPlanId
          }),
        })
      })

      const responses = await Promise.all(requests)
      const failed = responses.filter(r => !r.ok)
      
      if (failed.length > 0) {
        console.error('❌ Some budget updates failed')
        alert(`${failed.length} budget updates failed. Please try again.`)
      } else {
        console.log('✅ All budget updates successful')
        handleForceRefresh()
      }
    } catch (error) {
      console.error('❌ QuickBudget application failed:', error)
      alert('Failed to apply budget changes. Please try again.')
    }
  }

  const handleForceRefresh = () => {
    console.log('🔄 Force refresh triggered')
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <main className="h-screen flex flex-col bg-ynab-cream">
      <BudgetHeader 
        selectedPlanId={selectedPlanId} 
        onPlanChange={handlePlanChange}
        currentMonth={currentMonth}
        onMonthChange={handleMonthChange}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <BudgetMain 
          selectedPlanId={selectedPlanId}
          currentMonth={currentMonth}
          showTargetPanel={showTargetPanel}
          setShowTargetPanel={setShowTargetPanel}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          selectedGroups={selectedGroups}
          setSelectedGroups={setSelectedGroups}
          onBudgetDataChange={(data) => {
            console.log('🔄 Home: Budget data updated, plan info:', {
              selectedPlanId,
              currentMonth: currentMonth.toISOString(),
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
    </main>
  )
} 