'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { BudgetHeader } from '@/components/budget/budget-header'
import { BudgetMain } from '@/components/budget/budget-main.tsx'
import { QuickBudgetPanel } from '@/components/budget/quick-budget-panel'
import { TargetPanel } from '@/components/budget/target-panel'
import { TargetToggleButton } from '@/components/budget/target-toggle-button'
import { NotesPanel } from '@/components/budget/notes-panel'
import { NotesToggleButton } from '@/components/budget/notes-toggle-button'

export default function Home() {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [hasAutoSelected, setHasAutoSelected] = useState(false)
  const [showTargetPanel, setShowTargetPanel] = useState(false)
  const [showNotesPanel, setShowNotesPanel] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const searchParams = useSearchParams()
  const router = useRouter()

  // Check if a plan ID is provided in the URL, or auto-select first plan
  useEffect(() => {
    const planId = searchParams.get('plan')
    if (planId) {
      setSelectedPlanId(planId)
      setHasAutoSelected(true)
    } else if (!hasAutoSelected) {
      // No URL parameter, so fetch user's plans and auto-select first one
      fetchUserPlansAndAutoSelect()
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
    setSelectedPlanId(planId)
    
    // Update URL with the selected plan
    const newSearchParams = new URLSearchParams(searchParams)
    newSearchParams.set('plan', planId)
    router.push(`/?${newSearchParams.toString()}`)
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
        />
        <QuickBudgetPanel />
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