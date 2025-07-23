'use client'

import { useState, useEffect } from 'react'
import { Users, Shield, Edit3, Eye, Trash2, Crown, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'

interface User {
  id: string
  name: string
  email: string
  role: 'OWNER' | 'EDITOR' | 'VIEWER'
  joinedAt: string
}

interface TeamMembersProps {
  groupId: string
  currentUserRole: 'OWNER' | 'EDITOR' | 'VIEWER'
  currentUserId: string
}

export function TeamMembers({ groupId, currentUserRole, currentUserId }: TeamMembersProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Confirmation modal state
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [userToRemove, setUserToRemove] = useState<User | null>(null)

  const canRemoveUsers = currentUserRole === 'OWNER'

  useEffect(() => {
    fetchUsers()
  }, [groupId])

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/members`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.members || [])
      } else {
        setError('Failed to load team members')
      }
    } catch (error) {
      setError('Network error while loading members')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveUser = (user: User) => {
    setUserToRemove(user)
    setShowRemoveModal(true)
  }

  const confirmRemoveUser = async () => {
    if (!userToRemove) return

    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/groups/${groupId}/members/${userToRemove.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSuccess(`${userToRemove.name || userToRemove.email} has been removed from the team`)
        fetchUsers() // Refresh the list
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to remove user')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setShowRemoveModal(false)
      setUserToRemove(null)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="w-3 h-3" />
      case 'EDITOR':
        return <Edit3 className="w-3 h-3" />
      case 'VIEWER':
        return <Eye className="w-3 h-3" />
      default:
        return <Shield className="w-3 h-3" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'EDITOR':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'VIEWER':
        return 'bg-gray-50 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-600">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Current Members */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Team Members ({users.length}/5)</h3>
          </div>
          <div className="text-sm text-gray-500">
            {users.filter(u => u.role === 'OWNER').length} Owner{users.filter(u => u.role === 'OWNER').length !== 1 ? 's' : ''} • {' '}
            {users.filter(u => u.role === 'EDITOR').length} Editor{users.filter(u => u.role === 'EDITOR').length !== 1 ? 's' : ''} • {' '}
            {users.filter(u => u.role === 'VIEWER').length} Viewer{users.filter(u => u.role === 'VIEWER').length !== 1 ? 's' : ''}
          </div>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No team members found</p>
            <p className="text-sm text-gray-400 mt-1">
              Team members will appear here once they join
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">
                      {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900">{user.name || 'Unnamed User'}</p>
                      {user.id === currentUserId && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">You</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-500">Joined {formatDate(user.joinedAt)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className={`flex items-center space-x-1 px-3 py-1 rounded-full border text-xs font-medium ${getRoleColor(user.role)}`}>
                    {getRoleIcon(user.role)}
                    <span>{user.role}</span>
                  </div>
                  
                  {canRemoveUsers && user.id !== currentUserId && (
                    <Button
                      onClick={() => handleRemoveUser(user)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Role Descriptions */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Role Permissions</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Crown className="w-4 h-4 text-purple-600" />
              <span className="font-medium">Owner:</span>
              <span>Full access including user management and deletion permissions</span>
            </div>
            <div className="flex items-center space-x-2">
              <Edit3 className="w-4 h-4 text-green-600" />
              <span className="font-medium">Editor:</span>
              <span>Can add transactions and categories but cannot delete major items or manage users</span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-gray-600" />
              <span className="font-medium">Viewer:</span>
              <span>Can view all budget data but cannot make changes</span>
            </div>
          </div>
        </div>

        {users.length >= 5 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              ⚠️ This budget has reached the maximum of 5 members.
            </p>
          </div>
        )}
      </Card>

      {/* Remove User Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={confirmRemoveUser}
        title="Remove Team Member"
        message={`Are you sure you want to remove ${userToRemove?.name || userToRemove?.email} from this budget? They will lose access to all budget data and transactions.`}
        confirmText="Remove Member"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  )
} 