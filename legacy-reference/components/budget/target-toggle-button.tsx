'use client'

import { Target } from 'lucide-react'

interface TargetToggleButtonProps {
  isOpen: boolean
  onToggle: () => void
}

export function TargetToggleButton({ isOpen, onToggle }: TargetToggleButtonProps) {
  if (isOpen) {
    return null // Don't show button when panel is open
  }

  return (
    <button
      onClick={onToggle}
      className="fixed right-4 top-1/2 transform -translate-y-1/2 translate-y-20 bg-blue-600 text-white p-3 rounded-l-lg shadow-lg hover:bg-blue-700 transition-colors z-10"
      title="Open Target Panel"
    >
      <Target className="w-5 h-5" />
    </button>
  )
} 