'use client'

import { useState, useEffect } from 'react'
import { X, StickyNote, Plus, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'

interface Note {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  category?: {
    id: string
    name: string
  }
  categoryGroup?: {
    id: string
    name: string
  }
}

interface NotesPanelProps {
  isVisible: boolean
  onClose: () => void
  selectedCategories: Set<string>
  selectedGroups: Set<string>
  planId?: string
}

export function NotesPanel({ isVisible, onClose, selectedCategories, selectedGroups, planId }: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [editNoteContent, setEditNoteContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    noteToDelete?: Note
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })

  // Fetch notes for this plan
  useEffect(() => {
    if (isVisible && planId) {
      fetchNotes()
    }
  }, [isVisible, planId])

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/notes?planId=${planId}`)
      if (response.ok) {
        const data = await response.json()
        setNotes(data)
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSelectedItemsText = () => {
    const totalSelected = selectedCategories.size + selectedGroups.size
    if (totalSelected === 0) return 'No items selected'
    
    const parts = []
    if (selectedCategories.size > 0) {
      parts.push(`${selectedCategories.size} categor${selectedCategories.size === 1 ? 'y' : 'ies'}`)
    }
    if (selectedGroups.size > 0) {
      parts.push(`${selectedGroups.size} group${selectedGroups.size === 1 ? '' : 's'}`)
    }
    
    return parts.join(' and ')
  }

  const handleCreateNote = async () => {
    if (!planId || !newNoteContent.trim()) return
    
    setIsSubmitting(true)
    try {
      const selectedItems = [
        ...Array.from(selectedCategories).map(id => ({ type: 'category', id })),
        ...Array.from(selectedGroups).map(id => ({ type: 'group', id }))
      ]

      for (const item of selectedItems) {
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: newNoteContent.trim(),
            planId,
            [item.type === 'category' ? 'categoryId' : 'categoryGroupId']: item.id,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          alert(`Failed to create note: ${errorData.error || 'Unknown error'}`)
          return
        }
      }

      // Refresh notes after creating new ones
      await fetchNotes()
      setShowCreateForm(false)
      setNewNoteContent('')
    } catch (error) {
      console.error('Failed to create note:', error)
      alert('Failed to create note. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditNote = async (noteId: string) => {
    if (!editNoteContent.trim()) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editNoteContent.trim(),
        }),
      })

      if (response.ok) {
        await fetchNotes()
        setEditingNote(null)
        setEditNoteContent('')
      } else {
        const errorData = await response.json()
        alert(`Failed to update note: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to update note:', error)
      alert('Failed to update note. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const showDeleteConfirmation = (note: Note) => {
    const categoryName = note.category?.name || note.categoryGroup?.name || 'Note'
    setConfirmationDialog({
      isOpen: true,
      title: 'Delete Note',
      message: `Are you sure you want to delete this note for "${categoryName}"? This action cannot be undone.`,
      onConfirm: () => confirmDeleteNote(note.id),
      noteToDelete: note
    })
  }

  const closeConfirmationDialog = () => {
    setConfirmationDialog(prev => ({ ...prev, isOpen: false }))
  }

  const confirmDeleteNote = async (noteId: string) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchNotes()
        closeConfirmationDialog()
      } else {
        const errorData = await response.json()
        alert(`Failed to delete note: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to delete note:', error)
      alert('Failed to delete note. Please try again.')
    }
  }

  const startEdit = (note: Note) => {
    setEditingNote(note.id)
    setEditNoteContent(note.content)
  }

  const cancelEdit = () => {
    setEditingNote(null)
    setEditNoteContent('')
  }

  if (!isVisible) return null

  return (
    <div className="w-80 bg-white border-l border-ynab-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-ynab-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <StickyNote className="w-5 h-5 text-orange-600" />
          <h2 className="font-semibold text-gray-900">Notes</h2>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Selection Info & Create Form */}
      {(selectedCategories.size > 0 || selectedGroups.size > 0) && (
        <div className="p-4 bg-orange-50 border-b border-orange-200">
          <div className="text-sm text-orange-800 font-medium mb-2">
            Selected: {getSelectedItemsText()}
          </div>
          
          {showCreateForm ? (
            <div className="space-y-3">
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Add a note..."
                className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex space-x-2">
                <Button
                  onClick={handleCreateNote}
                  disabled={!newNoteContent.trim() || isSubmitting}
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700 text-white flex-1"
                >
                  {isSubmitting ? 'Saving...' : 'Save Note'}
                </Button>
                <Button
                  onClick={() => {
                    setShowCreateForm(false)
                    setNewNoteContent('')
                  }}
                  size="sm"
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setShowCreateForm(true)}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Note for Selected
            </Button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            Loading notes...
          </div>
        ) : notes.length === 0 ? (
          <div className="p-4 text-center">
            <StickyNote className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-sm mb-4">No notes yet</p>
            <Button
              onClick={() => setShowCreateForm(true)}
              size="sm"
              variant="outline"
              disabled={selectedCategories.size === 0 && selectedGroups.size === 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Note
            </Button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                {/* Note Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm">
                      {note.category?.name || note.categoryGroup?.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      onClick={() => startEdit(note)}
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => showDeleteConfirmation(note)}
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Note Content */}
                {editingNote === note.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editNoteContent}
                      onChange={(e) => setEditNoteContent(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleEditNote(note.id)}
                        disabled={!editNoteContent.trim() || isSubmitting}
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        {isSubmitting ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        onClick={cancelEdit}
                        size="sm"
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {note.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationDialog.isOpen}
        onClose={closeConfirmationDialog}
        onConfirm={confirmationDialog.onConfirm}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  )
} 