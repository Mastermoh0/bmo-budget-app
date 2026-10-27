'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function NewCategoryInput({ onCancel, onCreate }) {
  const [categoryName, setCategoryName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!categoryName.trim()) return
    
    setIsLoading(true)
    try {
      await onCreate(categoryName.trim())
      setCategoryName('')
    } catch (error) {
      console.error('Failed to create category:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setCategoryName('')
    onCancel()
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
      <div className="flex items-center space-x-3">
        <div className="w-4 h-4" /> {/* Spacer for alignment with categories */}
        <Input
          type="text"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Enter category name..."
          className="flex-1"
          autoFocus
          disabled={isLoading}
        />
        <Button
          onClick={handleSubmit}
          disabled={!categoryName.trim() || isLoading}
          size="sm"
        >
          {isLoading ? 'Adding...' : 'OK'}
        </Button>
        <Button
          onClick={handleCancel}
          disabled={isLoading}
          variant="ghost"
          size="sm"
        >
          Cancel
        </Button>
      </div>
    </div>
  )
} 