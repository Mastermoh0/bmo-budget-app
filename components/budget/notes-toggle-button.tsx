'use client'

import { StickyNote } from 'lucide-react'

interface NotesToggleButtonProps {
  isOpen: boolean
  onToggle: () => void
}

export function NotesToggleButton({ isOpen, onToggle }: NotesToggleButtonProps) {
  if (isOpen) {
    return null // Don't show button when panel is open
  }

  return (
    <button
      onClick={onToggle}
      className="fixed right-4 top-1/2 transform -translate-y-1/2 translate-y-32 bg-orange-600 text-white p-3 rounded-l-lg shadow-lg hover:bg-orange-700 transition-colors z-10"
      title="Open Notes Panel"
    >
      <StickyNote className="w-5 h-5" />
    </button>
  )
} 