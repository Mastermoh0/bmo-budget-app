'use client'

import { Zap } from 'lucide-react'

interface QuickBudgetToggleButtonProps {
  isOpen: boolean
  onToggle: () => void
}

export function QuickBudgetToggleButton({ isOpen, onToggle }: QuickBudgetToggleButtonProps) {
  if (isOpen) return null

  return (
    <button
      onClick={onToggle}
      className="fixed right-4 bottom-32 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors z-10 group"
      title="Quick Budget"
    >
      <Zap className="w-5 h-5" />
      <span className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
        Quick Budget
      </span>
    </button>
  )
} 