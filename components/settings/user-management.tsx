'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Mail, Shield, Edit3, Eye, Trash2, Crown, Users, Send, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'

interface User {
  id: string
  name: string
  email: string
  role: 'OWNER' | 'EDITOR' | 'VIEWER'
  joinedAt: string
}

interface Invitation {
  id: string
  email: string
  role: 'OWNER' | 'EDITOR' | 'VIEWER'
  createdAt: string
  expires: string
  invitedBy: string
}

interface UserManagementProps {
  groupId: string
  currentUserRole: 'OWNER' | 'EDITOR' | 'VIEWER'
  currentUserId: string
}

export function UserManagement({ groupId, currentUserRole, currentUserId }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Invitation form state
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'VIEWER' as 'OWNER' | 'EDITOR' | 'VIEWER'
  })

  // Confirmation modal state
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [userToRemove, setUserToRemove] = useState<User | null>(null)

  useEffect(() => {
    fetchUsers()
    fetchInvitations()
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
    }
  }

  const fetchInvitations = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/invitations`)
      if (response.ok) {
        const data = await response.json()
        setInvitations(data.invitations || [])
      } else {
        console.error('Failed to load invitations')
      }
    } catch (error) {
      console.error('Network error while loading invitations')
    } finally {
      setLoading(false)
    }
  }

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inviteForm.email.trim()) {
      setError('Email address is required')
      return
    }

    if (!/\S+@\S+\.\S+/.test(inviteForm.email)) {
      setError('Please enter a valid email address')
      return
    }

    setInviting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/invitations/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteForm.email.trim(),
          role: inviteForm.role,
          groupId: groupId
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`Invitation sent to ${inviteForm.email}`)
        setInviteForm({ email: '', role: 'VIEWER' })
        fetchInvitations() // Refresh invitations list
      } else {
        setError(data.error || 'Failed to send invitation')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveUser = (user: User) => {
    setUserToRemove(user)
    setShowRemoveModal(true)
  }

  const confirmRemoveUser = async () => {
    if (!userToRemove) return

    try {
      const response = await fetch(`/api/groups/${groupId}/members/${userToRemove.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setUsers(users.filter(u => u.id !== userToRemove.id))
        setSuccess(`${userToRemove.name} has been removed from the budget`)
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
        return <Crown className="w-4 h-4 text-yellow-600" />
      case 'EDITOR':
        return <Edit3 className="w-4 h-4 text-green-600" />
      case 'VIEWER':
        return <Eye className="w-4 h-4 text-blue-600" />
      default:
        return <Users className="w-4 h-4 text-gray-600" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'EDITOR':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'VIEWER':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const canInviteUsers = currentUserRole === 'OWNER'
  const canRemoveUsers = currentUserRole === 'OWNER'

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Members</h3>
        <p className="text-sm text-gray-600">
          Manage who has access to this budget and their permission levels.
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
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

      {/* Invite New User */}
      {canInviteUsers && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h4 className="text-lg font-medium text-gray-900">Invite New Member</h4>
          </div>
          
          <form onSubmit={handleSendInvitation} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="colleague@company.com"
                    className="pl-10"
                    disabled={inviting}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={inviting}
                >
                  <option value="VIEWER">👁️ Viewer</option>
                  <option value="EDITOR">✏️ Editor</option>
                  <option value="OWNER">👑 Owner</option>
                </select>
              </div>
            </div>

            {/* Role Description */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                {inviteForm.role === 'VIEWER' && '👁️ Viewers can view all budget data but cannot make changes.'}
                {inviteForm.role === 'EDITOR' && '✏️ Editors can add transactions and categories but cannot delete major items or manage users.'}
                {inviteForm.role === 'OWNER' && '👑 Owners have full access including user management and deletion permissions.'}
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={inviting || users.length >= 5}
              className="w-full md:w-auto"
            >
              {inviting ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Sending Invitation...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>

            {users.length >= 5 && (
              <p className="text-sm text-amber-600">
                ⚠️ This budget has reached the maximum of 5 members.
              </p>
            )}
          </form>
        </Card>
      )}

      {/* Current Members */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-gray-900">Current Members ({users.length}/5)</h4>
          <div className="text-sm text-gray-500">
            {users.filter(u => u.role === 'OWNER').length} Owner{users.filter(u => u.role === 'OWNER').length !== 1 ? 's' : ''} • {' '}
            {users.filter(u => u.role === 'EDITOR').length} Editor{users.filter(u => u.role === 'EDITOR').length !== 1 ? 's' : ''} • {' '}
            {users.filter(u => u.role === 'VIEWER').length} Viewer{users.filter(u => u.role === 'VIEWER').length !== 1 ? 's' : ''}
          </div>
        </div>

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

          {users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No team members found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card className="p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Pending Invitations ({invitations.length})</h4>
          
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-gray-900">{invitation.email}</p>
                    <p className="text-sm text-gray-600">
                      Invited {new Date(invitation.createdAt).toLocaleDateString()} • 
                      Expires {new Date(invitation.expires).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className={`flex items-center space-x-1 px-3 py-1 rounded-full border text-xs font-medium ${getRoleColor(invitation.role)}`}>
                  {getRoleIcon(invitation.role)}
                  <span>{invitation.role}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

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