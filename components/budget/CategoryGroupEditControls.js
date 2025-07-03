'use client'

import { useState } from 'react'
import { Edit3, Trash2, Check, X } from 'lucide-react'

export function CategoryGroupEditControls({ group, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(group.name)

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
      }
    } catch (error) {
      console.error('Failed to delete group:', error)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditName(group.name)
  }

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="px-2 py-1 border border-ynab-gray-300 rounded focus:outline-none focus:border-ynab-blue text-sm font-medium"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') handleCancel()
          }}
        />
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
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setIsEditing(true)}
        className="p-1 text-ynab-gray-500 hover:text-ynab-blue hover:bg-white rounded transition-colors"
        title="Edit group name"
      >
        <Edit3 className="w-3 h-3" />
      </button>
      <button
        onClick={handleDelete}
        className="p-1 text-ynab-gray-500 hover:text-ynab-red hover:bg-white rounded transition-colors"
        title="Delete group"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  )
} 