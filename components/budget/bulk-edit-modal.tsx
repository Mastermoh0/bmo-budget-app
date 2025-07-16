'use client'

import { useState } from 'react'
import { X, Edit3, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'

interface Category {
  id: string
  name: string
  budgeted: number
  activity: number
  available: number
}

interface BulkEditModalProps {
  isOpen: boolean
  onClose: () => void
  selectedCategories: Category[]
  onUpdate: (updates: { categoryId: string, changes: any }[]) => Promise<void>
}

export function BulkEditModal({ isOpen, onClose, selectedCategories, onUpdate }: BulkEditModalProps) {
  const [editMode, setEditMode] = useState<'names' | 'budget'>('names')
  const [newNames, setNewNames] = useState<{ [key: string]: string }>({})
  const [bulkBudgetAmount, setBulkBudgetAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Initialize names when modal opens
  useState(() => {
    if (isOpen && selectedCategories.length > 0) {
      const names: { [key: string]: string } = {}
      selectedCategories.forEach(cat => {
        names[cat.id] = cat.name
      })
      setNewNames(names)
    }
  }, [isOpen, selectedCategories])

  const handleNameChange = (categoryId: string, newName: string) => {
    setNewNames(prev => ({
      ...prev,
      [categoryId]: newName
    }))
  }

  const handleApplyNames = async () => {
    setIsLoading(true)
    try {
      const updates = selectedCategories
        .filter(cat => newNames[cat.id] !== cat.name)
        .map(cat => ({
          categoryId: cat.id,
          changes: { name: newNames[cat.id] }
        }))
      
      if (updates.length > 0) {
        await onUpdate(updates)
      }
      
      onClose()
    } catch (error) {
      console.error('Failed to update names:', error)
      alert('Failed to update category names. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyBudget = async () => {
    setIsLoading(true)
    try {
      const amount = parseFloat(bulkBudgetAmount) || 0
      const updates = selectedCategories.map(cat => ({
        categoryId: cat.id,
        changes: { budgeted: amount }
      }))
      
      await onUpdate(updates)
      onClose()
    } catch (error) {
      console.error('Failed to update budgets:', error)
      alert('Failed to update category budgets. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Edit Selected Categories ({selectedCategories.length})
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selection */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex space-x-4">
            <button
              onClick={() => setEditMode('names')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                editMode === 'names'
                  ? 'bg-ynab-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Names</span>
            </button>
            <button
              onClick={() => setEditMode('budget')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                editMode === 'budget'
                  ? 'bg-ynab-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Set Budget Amount</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {editMode === 'names' ? (
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                Edit the names of selected categories. Only changed names will be updated.
              </p>
              {selectedCategories.map((category) => (
                <div key={category.id} className="flex items-center space-x-3">
                  <div className="w-1/3 text-sm text-gray-600 truncate">
                    {category.name}
                  </div>
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={newNames[category.id] || category.name}
                      onChange={(e) => handleNameChange(category.id, e.target.value)}
                      placeholder="Category name"
                      className="w-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                Set the same budget amount for all selected categories.
              </p>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Budget Amount
                </label>
                <Input
                  type="number"
                  value={bulkBudgetAmount}
                  onChange={(e) => setBulkBudgetAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-lg"
                  step="0.01"
                />
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-gray-900">Selected Categories:</h4>
                {selectedCategories.map((category) => (
                  <div key={category.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">{category.name}</span>
                    <span className="text-gray-500">
                      Current: {formatCurrency(category.budgeted)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={editMode === 'names' ? handleApplyNames : handleApplyBudget}
            disabled={isLoading}
            className="bg-ynab-blue hover:bg-ynab-blue/90"
          >
            {isLoading ? 'Applying...' : (
              editMode === 'names' ? 'Update Names' : 'Set Budget Amount'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
} 