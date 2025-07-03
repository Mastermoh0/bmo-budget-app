'use client'

import { useState } from 'react'
import { formatCurrency, getCurrentMonth } from '@/lib/utils'
import { Input } from '@/components/ui/input'

export function BudgetAmountInput({ categoryId, initialAmount, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editAmount, setEditAmount] = useState(initialAmount?.toString() || '0')

  const handleSave = async () => {
    const amount = parseFloat(editAmount) || 0
    
    try {
      const response = await fetch(`/api/budgets/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          budgeted: amount,
          month: getCurrentMonth().toISOString(),
        }),
      })
      
      if (response.ok) {
        const updatedBudget = await response.json()
        onUpdate(categoryId, amount)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Failed to update budget:', error)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditAmount(initialAmount?.toString() || '0')
  }

  const handleInputChange = (e) => {
    let value = e.target.value
    // Remove any non-numeric characters except decimal point
    value = value.replace(/[^0-9.]/g, '')
    // Ensure only one decimal point
    const parts = value.split('.')
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('')
    }
    setEditAmount(value)
  }

  if (isEditing) {
    return (
      <Input
        type="text"
        value={editAmount}
        onChange={handleInputChange}
        className="w-20 text-right text-sm"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave()
          if (e.key === 'Escape') handleCancel()
        }}
        onBlur={handleSave}
      />
    )
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="w-20 text-right cursor-pointer hover:bg-white hover:border hover:border-ynab-blue px-2 py-1 rounded transition-colors"
    >
      <span className="text-sm">
        {formatCurrency(initialAmount || 0)}
      </span>
    </div>
  )
} 