'use client'

import { useState, useEffect } from 'react'
import { X, Target, Plus, TrendingUp, Calendar, DollarSign, CheckCircle, Edit2, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { TargetCreationForm } from './target-creation-form'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'

interface Goal {
  id: string
  type: 'WEEKLY_FUNDING' | 'MONTHLY_FUNDING' | 'YEARLY_FUNDING' | 'TARGET_BALANCE_BY_DATE' | 'CUSTOM'
  name?: string
  description?: string
  targetAmount?: number
  targetDate?: string
  weeklyAmount?: number
  weeklyDay?: number
  monthlyAmount?: number
  yearlyAmount?: number
  currentAmount: number
  isCompleted: boolean
  category?: {
    id: string
    name: string
  }
  categoryGroup?: {
    id: string
    name: string
  }
}

interface TargetPanelProps {
  isVisible: boolean
  onClose: () => void
  selectedCategories: Set<string>
  selectedGroups: Set<string>
  planId?: string
}

export function TargetPanel({ isVisible, onClose, selectedCategories, selectedGroups, planId }: TargetPanelProps) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    goalToDelete?: Goal
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })

  // Fetch goals for this plan
  useEffect(() => {
    if (isVisible && planId) {
      fetchGoals()
    }
  }, [isVisible, planId])

  const fetchGoals = async () => {
    try {
      const response = await fetch(`/api/goals?planId=${planId}`)
      if (response.ok) {
        const data = await response.json()
        setGoals(data)
      }
    } catch (error) {
      console.error('Failed to fetch goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSelectedItemsText = () => {
    const totalSelected = selectedCategories.size + selectedGroups.size
    if (totalSelected === 0) return 'No items selected'
    
    const parts = []
    if (selectedCategories.size > 0) {
      parts.push(`${selectedCategories.size} categor${selectedCategories.size === 1 ? 'y' : 'ies'}`)
    }
    if (selectedGroups.size > 0) {
      parts.push(`${selectedGroups.size} group${selectedGroups.size === 1 ? '' : 's'}`)
    }
    
    return parts.join(' and ')
  }

  const getProgressPercentage = (goal: Goal) => {
    if (!goal.targetAmount) return 0
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
  }

  const getGoalTypeDisplayName = (type: string) => {
    switch (type) {
      case 'WEEKLY_FUNDING': return 'Weekly'
      case 'MONTHLY_FUNDING': return 'Monthly'
      case 'YEARLY_FUNDING': return 'Yearly'
      case 'TARGET_BALANCE_BY_DATE': return 'Target by Date'
      case 'CUSTOM': return 'Custom'
      default: return type
    }
  }

  const getWeekdayName = (dayNumber?: number) => {
    if (dayNumber === undefined) return ''
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[dayNumber] || ''
  }

  const handleCreateTarget = async (targetData: any) => {
    if (!planId) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...targetData,
          planId,
        }),
      })

      if (response.ok) {
        // Refresh goals after creating new ones
        await fetchGoals()
        setShowCreateForm(false)
      } else {
        const errorData = await response.json()
        alert(`Failed to create target: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to create target:', error)
      alert('Failed to create target. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditTarget = async (targetData: any) => {
    if (!planId || !editingGoal) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/goals/${editingGoal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...targetData,
          planId,
        }),
      })

      if (response.ok) {
        // Refresh goals after editing
        await fetchGoals()
        setEditingGoal(null)
        setShowCreateForm(false)
      } else {
        const errorData = await response.json()
        alert(`Failed to update target: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to update target:', error)
      alert('Failed to update target. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const showDeleteConfirmation = (goal: Goal) => {
    const goalName = goal.name || `${goal.category?.name || goal.categoryGroup?.name} Target`
    setConfirmationDialog({
      isOpen: true,
      title: 'Delete Target',
      message: `Are you sure you want to delete "${goalName}"? This action cannot be undone.`,
      onConfirm: () => confirmDeleteTarget(goal.id),
      goalToDelete: goal
    })
  }

  const closeConfirmationDialog = () => {
    setConfirmationDialog(prev => ({ ...prev, isOpen: false }))
  }

  const confirmDeleteTarget = async (goalId: string) => {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Refresh goals after deleting
        await fetchGoals()
        closeConfirmationDialog()
      } else {
        const errorData = await response.json()
        alert(`Failed to delete target: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to delete target:', error)
      alert('Failed to delete target. Please try again.')
    }
  }

  const startEditingGoal = (goal: Goal) => {
    setEditingGoal(goal)
    setShowCreateForm(true)
  }

  if (!isVisible) return null

  return (
    <div className="w-80 bg-white border-l border-ynab-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-ynab-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Targets</h2>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Selection Info */}
      {(selectedCategories.size > 0 || selectedGroups.size > 0) && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="text-sm text-blue-800 font-medium mb-2">
            Selected: {getSelectedItemsText()}
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Set Target for Selected
          </Button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            Loading targets...
          </div>
        ) : goals.length === 0 ? (
          <div className="p-4 text-center">
            <Target className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-sm mb-4">No targets set yet</p>
            <Button
              onClick={() => setShowCreateForm(true)}
              size="sm"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Target
            </Button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                {/* Goal Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm">
                      {goal.name || `${goal.category?.name || goal.categoryGroup?.name} Target`}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {getGoalTypeDisplayName(goal.type)}
                      {goal.type === 'WEEKLY_FUNDING' && goal.weeklyDay !== undefined && 
                        ` • ${getWeekdayName(goal.weeklyDay)}`
                      }
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {goal.isCompleted && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                    <button
                      onClick={() => startEditingGoal(goal)}
                      className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 transition-colors"
                      title="Edit target"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => showDeleteConfirmation(goal)}
                      className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600 transition-colors"
                      title="Delete target"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{formatCurrency(goal.currentAmount)}</span>
                    <span>{formatCurrency(goal.targetAmount || 0)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        goal.isCompleted 
                          ? 'bg-green-500' 
                          : getProgressPercentage(goal) >= 100 
                            ? 'bg-blue-600' 
                            : 'bg-blue-400'
                      }`}
                      style={{ width: `${getProgressPercentage(goal)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1 text-center">
                    {getProgressPercentage(goal).toFixed(0)}% complete
                  </div>
                </div>

                {/* Goal Details */}
                <div className="text-xs text-gray-600">
                  {goal.type === 'WEEKLY_FUNDING' && (
                    <div>Save {formatCurrency(goal.weeklyAmount || 0)} weekly</div>
                  )}
                  {goal.type === 'MONTHLY_FUNDING' && (
                    <div>Save {formatCurrency(goal.monthlyAmount || 0)} monthly</div>
                  )}
                  {goal.type === 'YEARLY_FUNDING' && (
                    <div>Save {formatCurrency(goal.yearlyAmount || 0)} yearly</div>
                  )}
                  {goal.type === 'TARGET_BALANCE_BY_DATE' && goal.targetDate && (
                    <div>Target by {new Date(goal.targetDate).toLocaleDateString()}</div>
                  )}
                  {goal.description && (
                    <div className="text-gray-500 mt-1">{goal.description}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Target Creation Form */}
      <TargetCreationForm
        isOpen={showCreateForm}
        onClose={() => {
          setShowCreateForm(false)
          setEditingGoal(null)
        }}
        onSubmit={editingGoal ? handleEditTarget : handleCreateTarget}
        selectedCategories={selectedCategories}
        selectedGroups={selectedGroups}
        isSubmitting={isSubmitting}
        editingGoal={editingGoal}
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