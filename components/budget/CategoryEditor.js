'use client'

import { useState } from 'react'
import { Edit3, Plus, Trash2, Check, X, Target } from 'lucide-react'

export function CategoryEditor({ category, groupId, onUpdate, onDelete, onAdd, showOnGroupHover }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(category?.name || '')
  const [isAdding, setIsAdding] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

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
    // Call onDelete directly - confirmation is handled by parent component
    onDelete(category.id)
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return
    
    try {
      const response = await fetch(`/api/categories/${groupId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName }),
      })
      
      if (response.ok) {
        const newCategory = await response.json()
        onAdd(newCategory)
        setNewCategoryName('')
        setIsAdding(false)
      }
    } catch (error) {
      console.error('Failed to create category:', error)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditName(category?.name || '')
  }

  // Render add new category form
  if (isAdding && !category) {
    return (
      <div className="px-6 py-3 hover:bg-ynab-gray-50 border-b border-ynab-gray-200">
        <div className="grid grid-cols-4 gap-4 items-center">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4" /> {/* Spacer for indent */}
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Enter category name..."
              className="flex-1 px-2 py-1 border border-ynab-gray-300 rounded focus:outline-none focus:border-ynab-blue text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCategory()
                if (e.key === 'Escape') setIsAdding(false)
              }}
            />
          </div>
          <div></div> {/* Empty budgeted column */}
          <div></div> {/* Empty activity column */}
          <div className="flex items-center space-x-1">
            <button
              onClick={handleAddCategory}
              className="p-1 text-ynab-green hover:bg-ynab-green hover:text-white rounded transition-colors"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="p-1 text-ynab-gray-500 hover:bg-ynab-gray-200 rounded transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render "Add Category" button
  if (!category) {
    if (showOnGroupHover) {
      return (
        <div className="px-6 py-2">
          <div className="flex items-center justify-center">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsAdding(true)
              }}
              className="w-8 h-8 bg-blue-500 hover:bg-blue-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover/category-list:opacity-100 transition-all duration-200 hover:scale-110 shadow-lg z-10 relative"
              title="Add Category"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )
    } else {
      return (
        <div className="px-6 py-2">
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsAdding(true)
            }}
            className="flex items-center space-x-2 text-black border border-black px-3 py-1 rounded hover:bg-black hover:text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      )
    }
  }

  // Render editing mode
  if (isEditing) {
    return (
      <div className="px-6 py-3 hover:bg-ynab-gray-50 border-b border-ynab-gray-200 group">
        <div className="grid grid-cols-4 gap-4 items-center">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4" /> {/* Spacer for indent */}
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
            <Target className="w-3 h-3 text-ynab-gray-400" />
          </div>
          <div className="text-right">
            <span className="text-sm text-ynab-gray-600">${category.budgeted}</span>
          </div>
          <div className="text-right">
            <span className={`text-sm ${category.activity < 0 ? 'text-ynab-red' : 'text-ynab-green'}`}>
              ${category.activity}
            </span>
          </div>
          <div className="flex items-center space-x-1">
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
        </div>
      </div>
    )
  }

  // Render normal view with edit controls
  return (
    <div className="px-6 py-3 hover:bg-ynab-gray-50 cursor-pointer border-b border-ynab-gray-200 group">
      <div className="grid grid-cols-4 gap-4 items-center">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4" /> {/* Spacer for indent */}
            <span className="text-ynab-gray-700">{category.name}</span>
            <Target className="w-3 h-3 text-ynab-gray-400" />
          </div>
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-ynab-gray-500 hover:text-ynab-blue hover:bg-white rounded transition-colors"
              title="Edit category name"
            >
              <Edit3 className="w-2 h-2" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 text-ynab-gray-500 hover:text-ynab-red hover:bg-white rounded transition-colors"
              title="Delete category"
            >
              <Trash2 className="w-2 h-2" />
            </button>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm">${category.budgeted}</span>
        </div>
        <div className={`text-right ${category.activity < 0 ? 'text-ynab-red' : 'text-ynab-green'}`}>
          <span className="text-sm">${category.activity}</span>
        </div>
        <div className={`text-right font-medium ${
          category.available > 0 ? 'text-ynab-green' : 
          category.available < 0 ? 'text-ynab-red' : 'text-ynab-gray-600'
        }`}>
          <span className="text-sm">${category.available}</span>
        </div>
      </div>
    </div>
  )
} 