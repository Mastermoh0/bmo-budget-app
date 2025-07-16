'use client'

import { useEffect, useRef } from 'react'
import { EyeOff, Eye, X, Trash2, Target, Edit3, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ContextMenu({ 
  isOpen, 
  position, 
  onClose, 
  onHide, 
  onUnhide,
  onDelete, 
  onSetTarget,
  onBulkEdit,
  onBulkDelete,
  onMove,
  onClearSelections,
  itemName,
  itemType, // 'category' or 'group'
  selectedCount = 0, // Number of selected items
  selectedCategories = [] // Array of selected category objects
}) {
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose()
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleAction = (action) => {
    action()
    onClose()
  }

  // Show different menu based on whether items are selected
  const hasSelectedItems = selectedCount > 0

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[160px]"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {hasSelectedItems ? (
        // Menu for when items are selected
        <>
          <div className="px-3 py-1 text-xs text-gray-500 border-b border-gray-100 mb-1">
            {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start px-3 py-2 h-auto text-sm font-normal hover:bg-gray-100"
            onClick={() => handleAction(onSetTarget)}
          >
            <Target className="w-4 h-4 mr-2" />
            Set Target
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start px-3 py-2 h-auto text-sm font-normal hover:bg-gray-100"
            onClick={() => handleAction(onBulkEdit)}
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit Selected
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start px-3 py-2 h-auto text-sm font-normal hover:bg-gray-100"
            onClick={() => handleAction(onMove)}
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Move to Group
          </Button>

          {/* Show Hide or Unhide based on selected categories */}
          {selectedCategories.some(cat => cat.isHidden) ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start px-3 py-2 h-auto text-sm font-normal hover:bg-gray-100"
              onClick={() => handleAction(onUnhide)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Unhide Selected
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start px-3 py-2 h-auto text-sm font-normal hover:bg-gray-100"
              onClick={() => handleAction(onHide)}
            >
              <EyeOff className="w-4 h-4 mr-2" />
              Hide Selected
            </Button>
          )}
          
          <div className="border-t border-gray-100 mt-1 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start px-3 py-2 h-auto text-sm font-normal text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => handleAction(onBulkDelete)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
          </div>
          
          <div className="border-t border-gray-100 mt-1 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start px-3 py-2 h-auto text-sm font-normal hover:bg-gray-100"
              onClick={() => handleAction(onClearSelections)}
            >
              <X className="w-4 h-4 mr-2" />
              Clear Selection
            </Button>
          </div>
        </>
      ) : (
        // Original menu for individual items
        <>
          <div className="px-3 py-1 text-xs text-gray-500 border-b border-gray-100 mb-1">
            {itemType === 'category' ? 'Category' : 'Group'}: {itemName}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start px-3 py-2 h-auto text-sm font-normal hover:bg-gray-100"
            onClick={() => handleAction(onHide)}
          >
            <EyeOff className="w-4 h-4 mr-2" />
            Hide {itemType}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start px-3 py-2 h-auto text-sm font-normal hover:bg-gray-100"
            onClick={() => handleAction(onClose)}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          
          <div className="border-t border-gray-100 mt-1 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start px-3 py-2 h-auto text-sm font-normal text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => handleAction(onDelete)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete {itemType}
            </Button>
          </div>
        </>
      )}
    </div>
  )
} 