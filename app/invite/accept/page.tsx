'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { CheckCircle, UserPlus, AlertCircle, Loader2, Mail, Users, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface InvitationDetails {
  email: string
  role: string
  group: {
    id: string
    name: string
    description: string
    currency: string
  }
  invitedBy: string
  createdAt: string
  expires: string
}

export default function AcceptInvitePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link')
      setLoading(false)
      return
    }

    fetchInvitationDetails()
  }, [token])

  const fetchInvitationDetails = async () => {
    try {
      const response = await fetch(`/api/invitations/accept?token=${token}`)
      const data = await response.json()

      if (response.ok) {
        setInvitation(data.invitation)
      } else {
        setError(data.error || 'Failed to load invitation details')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async () => {
    if (!session) {
      // Redirect to sign in with return URL
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.href)}`)
      return
    }

    if (!token) {
      setError('Invalid invitation token')
      return
    }

    setAccepting(true)
    setError('')

    try {
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        // Redirect to the budget after a short delay
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } else {
        setError(data.error || 'Failed to accept invitation')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setAccepting(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Shield className="w-5 h-5 text-blue-600" />
      case 'EDITOR':
        return <UserPlus className="w-5 h-5 text-green-600" />
      case 'VIEWER':
        return <Users className="w-5 h-5 text-gray-600" />
      default:
        return <Users className="w-5 h-5 text-gray-600" />
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'Full access to all budget features including user management'
      case 'EDITOR':
        return 'Can add transactions and categories, but cannot delete major items'
      case 'VIEWER':
        return 'Can view all budget data but cannot make changes'
      default:
        return 'Unknown role'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white shadow-xl p-8 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading invitation details...</p>
        </Card>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white shadow-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/auth/signin">
            <Button className="w-full">Go to Sign In</Button>
          </Link>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white shadow-xl p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to the Team! 🎉</h2>
          <p className="text-gray-600 mb-2">
            You've successfully joined <strong>{invitation?.group.name}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Redirecting you to the budget...
          </p>
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-white shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">BMO</h1>
                <p className="text-sm text-gray-500">Budget Money Online</p>
              </div>
            </div>
          </div>
        </div>

        {/* Invitation Details */}
        <div className="p-6 space-y-6">
          <div className="text-center">
            <UserPlus className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              You're Invited to Collaborate!
            </h2>
            <p className="text-gray-600">
              <strong>{invitation?.invitedBy}</strong> has invited you to join their budget
            </p>
          </div>

          {/* Budget Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900">Budget Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Budget Name:</span>
                <span className="font-medium">{invitation?.group.name}</span>
              </div>
              {invitation?.group.description && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Description:</span>
                  <span className="font-medium">{invitation.group.description}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Currency:</span>
                <span className="font-medium">{invitation?.group.currency}</span>
              </div>
            </div>
          </div>

          {/* Role Info */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-2">
              {invitation && getRoleIcon(invitation.role)}
              <h3 className="font-semibold text-gray-900">Your Role: {invitation?.role}</h3>
            </div>
            <p className="text-sm text-gray-600">
              {invitation && getRoleDescription(invitation.role)}
            </p>
          </div>

          {/* Email Verification Notice */}
          {session?.user?.email !== invitation?.email && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Mail className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Email Address Notice</p>
                  <p className="text-sm text-yellow-700">
                    This invitation was sent to <strong>{invitation?.email}</strong>.
                    {session ? ' Please ensure you are signed in with the correct email address.' : ' Please sign in with this email address to accept the invitation.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {!session ? (
              <div className="space-y-2">
                <Button
                  onClick={() => router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.href)}`)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Sign In to Accept Invitation
                </Button>
                <p className="text-xs text-center text-gray-500">
                  Don't have an account? You can create one after signing in.
                </p>
              </div>
            ) : session.user?.email === invitation?.email ? (
              <Button
                onClick={handleAcceptInvitation}
                disabled={accepting}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {accepting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Accepting Invitation...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Invitation
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button
                  onClick={() => router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.href)}`)}
                  className="w-full"
                  variant="outline"
                >
                  Sign In with {invitation?.email}
                </Button>
                <p className="text-xs text-center text-gray-500">
                  You need to sign in with the invited email address
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
} 