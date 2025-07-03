'use client'

import { useState } from 'react'
import { X, Target, Calendar, DollarSign, Clock, Repeat } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface TargetCreationFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (targetData: any) => void
  selectedCategories: Set<string>
  selectedGroups: Set<string>
  isSubmitting?: boolean
}

type TargetType = 'WEEKLY_FUNDING' | 'MONTHLY_FUNDING' | 'YEARLY_FUNDING' | 'TARGET_BALANCE_BY_DATE' | 'CUSTOM'

const WEEKDAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

export function TargetCreationForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  selectedCategories, 
  selectedGroups,
  isSubmitting = false 
}: TargetCreationFormProps) {
  const [targetType, setTargetType] = useState<TargetType>('MONTHLY_FUNDING')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    targetDate: '',
    weeklyDay: 6, // Saturday by default
  })

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

  const getTargetTypeDescription = () => {
    switch (targetType) {
      case 'WEEKLY_FUNDING':
        return `Save ${formData.amount ? formatCurrency(parseFloat(formData.amount)) : '$0.00'} every ${WEEKDAYS.find(d => d.value === formData.weeklyDay)?.label}`
      case 'MONTHLY_FUNDING':
        return `Save ${formData.amount ? formatCurrency(parseFloat(formData.amount)) : '$0.00'} each month`
      case 'YEARLY_FUNDING':
        return `Save ${formData.amount ? formatCurrency(parseFloat(formData.amount)) : '$0.00'} each year`
      case 'TARGET_BALANCE_BY_DATE':
        return `Reach ${formData.amount ? formatCurrency(parseFloat(formData.amount)) : '$0.00'}${formData.targetDate ? ` by ${new Date(formData.targetDate).toLocaleDateString()}` : ''}`
      case 'CUSTOM':
        return 'Custom target with flexible parameters'
      default:
        return ''
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (targetType === 'TARGET_BALANCE_BY_DATE' && !formData.targetDate) {
      alert('Please select a target date')
      return
    }

    const targetData = {
      type: targetType,
      name: formData.name.trim() || undefined,
      description: formData.description.trim() || undefined,
      targetAmount: targetType === 'TARGET_BALANCE_BY_DATE' ? amount : undefined,
      weeklyAmount: targetType === 'WEEKLY_FUNDING' ? amount : undefined,
      monthlyAmount: targetType === 'MONTHLY_FUNDING' ? amount : undefined,
      yearlyAmount: targetType === 'YEARLY_FUNDING' ? amount : undefined,
      weeklyDay: targetType === 'WEEKLY_FUNDING' ? formData.weeklyDay : undefined,
      targetDate: formData.targetDate || undefined,
      categoryIds: Array.from(selectedCategories),
      categoryGroupIds: Array.from(selectedGroups),
    }

    onSubmit(targetData)
  }

  const handleReset = () => {
    setFormData({
      name: '',
      description: '',
      amount: '',
      targetDate: '',
      weeklyDay: 6,
    })
    setTargetType('MONTHLY_FUNDING')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Set Target</h2>
                <p className="text-sm text-gray-600">Create a savings goal</p>
              </div>
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
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Selected Items */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-800">
              Setting target for: {getSelectedItemsText()}
            </p>
          </div>

          {/* Target Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Target Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetType('WEEKLY_FUNDING')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  targetType === 'WEEKLY_FUNDING'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Repeat className="w-4 h-4" />
                  <span className="font-medium">Weekly</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Save amount each week</p>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('MONTHLY_FUNDING')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  targetType === 'MONTHLY_FUNDING'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">Monthly</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Save amount each month</p>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('YEARLY_FUNDING')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  targetType === 'YEARLY_FUNDING'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">Yearly</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Save amount each year</p>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('TARGET_BALANCE_BY_DATE')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  targetType === 'TARGET_BALANCE_BY_DATE'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span className="font-medium">Target by Date</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Reach amount by date</p>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {targetType === 'TARGET_BALANCE_BY_DATE' ? 'Target Amount' : 'Amount to Save'}
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Weekly Day Selection */}
          {targetType === 'WEEKLY_FUNDING' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Day of Week
              </label>
              <select
                value={formData.weeklyDay}
                onChange={(e) => setFormData({ ...formData, weeklyDay: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {WEEKDAYS.map(day => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Target Date */}
          {targetType === 'TARGET_BALANCE_BY_DATE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Date
              </label>
              <Input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          )}

          {/* Optional Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Name (Optional)
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Emergency Fund, Vacation Savings"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <Input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add notes about this target..."
            />
          </div>

          {/* Preview */}
          {formData.amount && (
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-sm font-medium text-gray-700 mb-1">Preview:</p>
              <p className="text-sm text-gray-600">{getTargetTypeDescription()}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              onClick={handleReset}
              variant="outline"
              className="flex-1"
            >
              Reset
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Creating...' : 'Create Target'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 