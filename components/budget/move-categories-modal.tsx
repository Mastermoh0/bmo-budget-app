'use client'

import { useState } from 'react'
import { X, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Category {
  id: string
  name: string
  budgeted: number
  activity: number
  available: number
}

interface CategoryGroup {
  id: string
  name: string
  categories: Category[]
}

interface MoveCategoriesModalProps {
  isOpen: boolean
  onClose: () => void
  selectedCategories: Category[]
  availableGroups: CategoryGroup[]
  onMove: (targetGroupId: string) => void
}

export function MoveCategoriesModal({
  isOpen,
  onClose,
  selectedCategories,
  availableGroups,
  onMove
}: MoveCategoriesModalProps) {
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleMove = async () => {
    if (!selectedGroupId) return
    
    setIsLoading(true)
    try {
      await onMove(selectedGroupId)
      onClose()
    } catch (error) {
      console.error('Failed to move categories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setSelectedGroupId('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <FolderOpen className="w-5 h-5 mr-2" />
            Move Categories
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Selected Categories */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Moving {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'}:
            </h3>
            <div className="bg-gray-50 rounded-md p-3 max-h-32 overflow-y-auto">
              {selectedCategories.map((category) => (
                <div key={category.id} className="text-sm text-gray-600 py-1">
                  • {category.name}
                </div>
              ))}
            </div>
          </div>

          {/* Target Group Selection */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Select destination group:
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableGroups.map((group) => (
                <label
                  key={group.id}
                  className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedGroupId === group.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="targetGroup"
                    value={group.id}
                    checked={selectedGroupId === group.id}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{group.name}</div>
                    <div className="text-sm text-gray-500">
                      {group.categories.length} categor{group.categories.length === 1 ? 'y' : 'ies'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={!selectedGroupId || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? 'Moving...' : 'Confirm Move'}
          </Button>
        </div>
      </div>
    </div>
  )
} 