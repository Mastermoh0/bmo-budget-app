'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Edit3, Plus, Trash2, Check, X, ChevronDown, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function CategoryGroupEditor({ group, onUpdate, onDelete, onAdd, isExpanded, onToggle, onAddCategory, planId, isSelected, onToggleSelection, onSelectAll }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(group?.name || '')
  const [isAdding, setIsAdding] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')

  // Handle authentication/user errors by redirecting to sign-in
  const handleAuthError = async (error) => {
    console.log('Authentication error detected:', error)
    await signOut({
      callbackUrl: '/auth/signin',
      redirect: true
    })
  }

  const handleSave = async () => {
    if (!editName.trim()) return
    
    try {
      const response = await fetch(`/api/categories/${group.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName }),
      })
      
      if (response.ok) {
        const updatedGroup = await response.json()
        onUpdate(updatedGroup)
        setIsEditing(false)
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
        
        console.error('Failed to update group:', errorData)
      }
    } catch (error) {
      console.error('Failed to update group:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${group.name}" and all its categories?`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/categories/${group.id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        onDelete(group.id)
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
      }
    } catch (error) {
      console.error('Failed to delete group:', error)
    }
  }

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return
    
    try {
      console.log('Creating category group:', newGroupName, 'for plan:', planId)
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName, planId }),
      })
      
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const newGroup = await response.json()
        console.log('New group created:', newGroup)
        onAdd(newGroup)
        setNewGroupName('')
        setIsAdding(false)
      } else {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        
        // Check if it's an authentication/user error
        if (response.status === 401 || 
            errorData.error?.includes('not found in database') ||
            errorData.error?.includes('User not found') ||
            errorData.error?.includes('Unauthorized')) {
          await handleAuthError(errorData.error)
          return
        }
        
        alert(`Failed to create category group: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to create group:', error)
      alert('Failed to create category group. Please try again.')
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditName(group?.name || '')
  }

  const getGroupTotals = (categories) => {
    if (!categories) return { budgeted: 0, activity: 0, available: 0 }
    return categories.reduce(
      (totals, category) => ({
        budgeted: totals.budgeted + category.budgeted,
        activity: totals.activity + category.activity,
        available: totals.available + category.available,
      }),
      { budgeted: 0, activity: 0, available: 0 }
    )
  }

  // Render add new group form
  if (isAdding && !group) {
    return (
      <div className="px-6 py-3 bg-ynab-gray-50 border-b border-ynab-gray-200">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Enter group name..."
            className="flex-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddGroup()
              if (e.key === 'Escape') setIsAdding(false)
            }}
          />
          <Button
            onClick={handleAddGroup}
            size="icon"
            variant="ghost"
            className="text-green-600 hover:bg-green-100 hover:text-green-700"
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setIsAdding(false)}
            size="icon"
            variant="ghost"
            className="text-green-500 hover:bg-green-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  // Render "Add Group" button
  if (!group) {
    return (
      <div className="px-6 py-3 border-b border-ynab-gray-200">
        <Button
          onClick={() => setIsAdding(true)}
          variant="ghost"
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category Group</span>
        </Button>
      </div>
    )
  }

  // Render editing mode
  if (isEditing) {
    const totals = getGroupTotals(group.categories)
    return (
      <div className="px-6 py-3 bg-ynab-gray-50 hover:bg-ynab-gray-100 border-b border-ynab-gray-200">
        <div className="grid gap-4 items-center" style={{ gridTemplateColumns: '50px 1fr 140px 140px 140px' }}>
          <div /> {/* Spacer for selection column */}
          <div className="flex items-center space-x-2">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-ynab-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-ynab-gray-600" />
            )}
            <Input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 font-medium"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
                if (e.key === 'Escape') handleCancel()
              }}
            />
          </div>
          <div className="text-right font-medium text-ynab-gray-700">
            {formatCurrency(totals.budgeted)}
          </div>
          <div className={`text-right font-medium ${totals.activity < 0 ? 'text-ynab-red' : 'text-ynab-green'}`}>
            {formatCurrency(totals.activity)}
          </div>
          <div className="flex items-center justify-end space-x-1">
            <div className={`text-right font-medium ${
              totals.available > 0 ? 'text-ynab-green' : 
              totals.available < 0 ? 'text-ynab-red' : 'text-ynab-gray-600'
            }`}>
              {formatCurrency(totals.available)}
            </div>
            <Button
              onClick={handleSave}
              size="icon"
              variant="ghost"
              className="text-green-600 hover:bg-green-100 hover:text-green-700 ml-2"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleCancel}
              size="icon"
              variant="ghost"
              className="text-gray-500 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Render normal view with edit controls and toggle functionality
  const totals = getGroupTotals(group.categories)
  return (
    <div className="px-6 py-3 bg-ynab-gray-50 hover:bg-ynab-gray-100 border-b border-ynab-gray-200 group">
      <div 
        className="grid gap-4 items-center cursor-pointer"
        style={{ gridTemplateColumns: '50px 1fr 140px 140px 140px' }}
        onClick={() => onToggle && onToggle(group.id)}
      >
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            className="rounded text-blue-600"
            checked={isSelected || false}
            onChange={(e) => {
              e.stopPropagation()
              if (onToggleSelection) {
                onToggleSelection()
              }
            }}
          />
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (onSelectAll) {
                onSelectAll()
              }
            }}
            className="text-xs text-blue-600 hover:text-blue-700"
            title="Select all categories in this group"
          >
            All
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-ynab-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-ynab-gray-600" />
            )}
            <span className="font-medium text-ynab-gray-800">{group.name}</span>
            {/* Add Category button - Teal circle with plus (green-blue mix) */}
            <Button
              onClick={(e) => {
                e.stopPropagation()
                if (onAddCategory) {
                  onAddCategory()
                }
              }}
              size="icon"
              className="w-6 h-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-lg border border-white"
              title="Add Category"
            >
              <Plus className="w-4 h-4 font-bold" />
            </Button>
          </div>
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              onClick={(e) => {
                e.stopPropagation()
                setIsEditing(true)
              }}
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-gray-500 hover:text-blue-600 hover:bg-white"
              title="Edit group name"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation()
                handleDelete()
              }}
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-gray-500 hover:text-red-600 hover:bg-white"
              title="Delete group"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <div className="text-right font-medium text-ynab-gray-700">
          {formatCurrency(totals.budgeted)}
        </div>
        <div className={`text-right font-medium ${totals.activity < 0 ? 'text-ynab-red' : 'text-ynab-green'}`}>
          {formatCurrency(totals.activity)}
        </div>
        <div className={`text-right font-medium ${
          totals.available > 0 ? 'text-ynab-green' : 
          totals.available < 0 ? 'text-ynab-red' : 'text-ynab-gray-600'
        }`}>
          {formatCurrency(totals.available)}
        </div>
      </div>
    </div>
  )
} 