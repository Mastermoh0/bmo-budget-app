'use client'

import { useState } from 'react'
import { Edit3, Trash2, Check, X, Target } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { BudgetAmountInput } from './BudgetAmountInput'

export function CategoryRow({ category, groupId, month, onUpdate, onDelete, onBudgetUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(category.name)

  const handleSave = async () => {
    if (!editName.trim()) return
    
    try {
      const response = await fetch(`/api/categories/${groupId}/categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName }),
      })
      
      if (response.ok) {
        const updatedCategory = await response.json()
        onUpdate(updatedCategory)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Failed to update category:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/categories/${groupId}/categories/${category.id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        onDelete(category.id)
      }
    } catch (error) {
      console.error('Failed to delete category:', error)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditName(category.name)
  }

  return (
    <div className="px-6 py-3 hover:bg-ynab-gray-50 border-b border-ynab-gray-200 group">
      <div className="grid grid-cols-4 gap-4 items-center">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4" /> {/* Spacer for indent */}
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 px-2 py-1 border border-ynab-gray-300 rounded focus:outline-none focus:border-ynab-blue text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave()
                  if (e.key === 'Escape') handleCancel()
                }}
              />
            ) : (
              <span className="text-ynab-gray-700">{category.name}</span>
            )}
            <Target className="w-3 h-3 text-ynab-gray-400" />
          </div>
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="p-1 text-ynab-green hover:bg-ynab-green hover:text-white rounded transition-colors"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 text-ynab-gray-500 hover:bg-ynab-gray-200 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-ynab-gray-500 hover:text-ynab-blue hover:bg-white rounded transition-colors"
                  title="Edit category name"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1 text-ynab-gray-500 hover:text-ynab-red hover:bg-white rounded transition-colors"
                  title="Delete category"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <BudgetAmountInput
            category={category}
            month={month}
            onUpdate={onBudgetUpdate}
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
    </div>
  )
} 