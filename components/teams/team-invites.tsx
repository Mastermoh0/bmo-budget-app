'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Mail, Send, AlertCircle, CheckCircle, Clock, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

interface Invitation {
  id: string
  email: string
  role: 'OWNER' | 'EDITOR' | 'VIEWER'
  createdAt: string
  expires: string
  invitedBy: string
}

interface TeamInvitesProps {
  groupId: string
  currentUserRole: 'OWNER' | 'EDITOR' | 'VIEWER'
}

export function TeamInvites({ groupId, currentUserRole }: TeamInvitesProps) {
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

  const canInvite = currentUserRole === 'OWNER' || currentUserRole === 'EDITOR'

  useEffect(() => {
    fetchInvitations()
  }, [groupId])

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
        setSuccess(data.message || `Invitation sent to ${inviteForm.email}`)
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

  const handleResendInvitation = async (email: string, role: string) => {
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
          email: email,
          role: role,
          groupId: groupId
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message || `Invitation resent to ${email}`)
        fetchInvitations()
      } else {
        setError(data.error || 'Failed to resend invitation')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setInviting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-purple-100 text-purple-800'
      case 'EDITOR':
        return 'bg-green-100 text-green-800'
      case 'VIEWER':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isExpired = (expiresString: string) => {
    return new Date(expiresString) < new Date()
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
      {/* Send Invitation Form */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <UserPlus className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Send Team Invitation</h3>
        </div>

        {!canInvite ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Only team owners and editors can send invitations.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendInvitation} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  disabled={inviting}
                  required
                />
              </div>
              <div>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value as 'OWNER' | 'EDITOR' | 'VIEWER' }))}
                  disabled={inviting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="VIEWER">Viewer</option>
                  <option value="EDITOR">Editor</option>
                  {currentUserRole === 'OWNER' && <option value="OWNER">Owner</option>}
                </select>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={inviting || !inviteForm.email.trim()}
              className="w-full md:w-auto"
            >
              {inviting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Send className="w-4 h-4" />
                  <span>Send Invitation</span>
                </div>
              )}
            </Button>
          </form>
        )}
      </Card>

      {/* Pending Invitations */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Clock className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Pending Invitations</h3>
        </div>

        {invitations.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No pending invitations</p>
            <p className="text-sm text-gray-400 mt-1">
              Sent invitations will appear here until they're accepted
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium text-gray-900">{invitation.email}</p>
                      <p className="text-sm text-gray-500">
                        Invited {formatDate(invitation.createdAt)} • Expires {formatDate(invitation.expires)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeClass(invitation.role)}`}>
                      {invitation.role}
                    </span>
                    {isExpired(invitation.expires) && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        Expired
                      </span>
                    )}
                  </div>
                </div>
                
                {canInvite && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResendInvitation(invitation.email, invitation.role)}
                      disabled={inviting}
                    >
                      <Send className="w-3 h-3 mr-1" />
                      Resend
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
} 