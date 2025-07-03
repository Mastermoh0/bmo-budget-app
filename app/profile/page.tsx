'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { User, Mail, Calendar, CreditCard, Settings, LogOut, Edit2, Save, X, Plus, Trash2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'

interface UserProfile {
  id: string
  name: string
  email: string
  createdAt: string
  budgets: Array<{
    id: string
    name: string
    description?: string
    currency: string
    role: string
    memberCount: number
  }>
}

interface BudgetPlan {
  id: string
  name: string
  description?: string
  currency: string
  role: string
  memberCount: number
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', email: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  
  // Plan management states
  const [isCreatingPlan, setIsCreatingPlan] = useState(false)
  const [editingPlan, setEditingPlan] = useState<BudgetPlan | null>(null)
  const [planForm, setPlanForm] = useState({ name: '', description: '', currency: 'USD' })
  const [isPlanSaving, setIsPlanSaving] = useState(false)
  const [planError, setPlanError] = useState('')
  
  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<{ id: string, name: string } | null>(null)
  
  // Account deletion states
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    fetchProfile()
  }, [status, router])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setEditForm({ name: data.name, email: data.email })
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        
        // Check for authentication errors, 404s, or profile loading failures
        if (response.status === 401 || 
            response.status === 404 ||
            errorData.error?.includes('not found') ||
            errorData.error?.includes('User not found') ||
            errorData.error?.includes('Unauthorized')) {
          console.log('Profile error - redirecting to sign-in:', response.status, errorData.error)
          router.push('/auth/signin')
          return
        }
        
        setError('Failed to load profile')
      }
    } catch (error) {
      console.error('Network error loading profile:', error)
      // For network errors, also redirect to sign-in as it might be an auth issue
      router.push('/auth/signin')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setError('')
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    if (profile) {
      setEditForm({ name: profile.name, email: profile.email })
    }
    setError('')
  }

  const handleSave = async () => {
    if (!editForm.name.trim()) {
      setError('Name is required')
      return
    }

    if (!editForm.email.trim() || !/\S+@\S+\.\S+/.test(editForm.email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          email: editForm.email.trim().toLowerCase(),
        }),
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        setIsEditing(false)
      } else {
        const data = await response.json().catch(() => ({ error: 'Unknown error' }))
        
        // Check for authentication errors or 404s
        if (response.status === 401 || 
            response.status === 404 ||
            data.error?.includes('not found') ||
            data.error?.includes('User not found') ||
            data.error?.includes('Unauthorized')) {
          console.log('Profile update error - redirecting to sign-in:', response.status, data.error)
          router.push('/auth/signin')
          return
        }
        
        setError(data.error || 'Failed to update profile')
      }
    } catch (error) {
      setError('Network error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: '/auth/signin'
    })
  }

  // Plan management functions
  const handleCreatePlan = () => {
    setPlanForm({ name: '', description: '', currency: 'USD' })
    setPlanError('')
    setIsCreatingPlan(true)
  }

  const handleEditPlan = (plan: BudgetPlan) => {
    setPlanForm({ 
      name: plan.name, 
      description: plan.description || '', 
      currency: plan.currency 
    })
    setPlanError('')
    setEditingPlan(plan)
  }

  const handleSavePlan = async () => {
    if (!planForm.name.trim()) {
      setPlanError('Plan name is required')
      return
    }

    setIsPlanSaving(true)
    setPlanError('')

    try {
      const url = editingPlan ? `/api/budgets/${editingPlan.id}/plan` : '/api/budgets'
      const method = editingPlan ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: planForm.name.trim(),
          description: planForm.description.trim() || null,
          currency: planForm.currency
        }),
      })

      if (response.ok) {
        await fetchProfile() // Refresh profile data
        setIsCreatingPlan(false)
        setEditingPlan(null)
        setPlanForm({ name: '', description: '', currency: 'USD' })
      } else {
        const data = await response.json()
        setPlanError(data.error || `Failed to ${editingPlan ? 'update' : 'create'} plan`)
      }
    } catch (error) {
      setPlanError('Network error. Please try again.')
    } finally {
      setIsPlanSaving(false)
    }
  }

  const handleDeletePlan = (planId: string, planName: string) => {
    setPlanToDelete({ id: planId, name: planName })
    setShowDeleteModal(true)
  }

  const confirmDeletePlan = async () => {
    if (!planToDelete) return

    try {
      const response = await fetch(`/api/budgets/${planToDelete.id}/plan`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchProfile() // Refresh profile data
      } else {
        const data = await response.json()
        setPlanError(data.error || 'Failed to delete plan')
      }
    } catch (error) {
      setPlanError('Network error. Please try again.')
    } finally {
      setShowDeleteModal(false)
      setPlanToDelete(null)
    }
  }

  const handleCancelPlanEdit = () => {
    setIsCreatingPlan(false)
    setEditingPlan(null)
    setPlanForm({ name: '', description: '', currency: 'USD' })
    setPlanError('')
  }

  // Account deletion functions
  const handleDeleteAccount = () => {
    setShowDeleteAccountModal(true)
  }

  const confirmDeleteAccount = async () => {
    setIsDeletingAccount(true)
    
    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
      })

      if (response.ok) {
        // Account deleted successfully - sign out and redirect
        await signOut({
          callbackUrl: '/auth/signin?message=account-deleted'
        })
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete account')
        setShowDeleteAccountModal(false)
      }
    } catch (error) {
      setError('Network error. Please try again.')
      setShowDeleteAccountModal(false)
    } finally {
      setIsDeletingAccount(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile && !isLoading) {
    // If profile failed to load and we're not loading, redirect to sign-in
    router.push('/auth/signin')
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Redirecting to sign-in...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-50 overflow-auto">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-gray-600">Manage your account information and preferences</p>
            </div>
            <Button
              onClick={() => router.push('/')}
              variant="outline"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Personal Information
                  </h2>
                  <p className="text-gray-600 mt-1">Update your account details</p>
                </div>
                {!isEditing && (
                  <Button onClick={handleEdit} variant="outline" size="sm">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Enter your full name"
                      disabled={isSaving}
                    />
                  ) : (
                    <p className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-md">
                      {profile.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="Enter your email"
                      disabled={isSaving}
                    />
                  ) : (
                    <p className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-md">
                      {profile.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Member Since
                  </label>
                  <p className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-md">
                    {new Date(profile.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                {isEditing && (
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Budget Plans */}
            <Card className="p-6 mt-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Your Plans
                </h2>
                <Button
                  onClick={handleCreatePlan}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Plan</span>
                </Button>
              </div>

              {planError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{planError}</p>
                </div>
              )}

              {/* Create/Edit Plan Form */}
              {(isCreatingPlan || editingPlan) && (
                <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-4">
                    {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Plan Name *
                      </label>
                      <Input
                        type="text"
                        value={planForm.name}
                        onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                        placeholder="Enter plan name"
                        disabled={isPlanSaving}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <Input
                        type="text"
                        value={planForm.description}
                        onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                        placeholder="Enter plan description (optional)"
                        disabled={isPlanSaving}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        value={planForm.currency}
                        onChange={(e) => setPlanForm({ ...planForm, currency: e.target.value })}
                        disabled={isPlanSaving}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                        <option value="AUD">AUD - Australian Dollar</option>
                        <option value="JPY">JPY - Japanese Yen</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={handleSavePlan}
                      disabled={isPlanSaving}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isPlanSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {editingPlan ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {editingPlan ? 'Update Plan' : 'Create Plan'}
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleCancelPlanEdit}
                      variant="outline"
                      disabled={isPlanSaving}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Plans List */}
              <div className="space-y-4">
                {profile.budgets.map((plan) => (
                  <div
                    key={plan.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{plan.name}</h3>
                        {plan.description && (
                          <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>Currency: {plan.currency}</span>
                          <span>Role: {plan.role}</span>
                          <span>Members: {plan.memberCount}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => router.push(`/?plan=${plan.id}`)}
                          variant="outline"
                          size="sm"
                        >
                          Open
                        </Button>
                        <Button
                          onClick={() => handleEditPlan(plan)}
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeletePlan(plan.id, plan.name)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {profile.budgets.length === 0 && !isCreatingPlan && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-4">No plans found</p>
                    <Button onClick={handleCreatePlan} className="mx-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Plan
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/auth/change-password')}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="w-full justify-start text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Plans</span>
                  <span className="font-medium">{profile.budgets.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Account Status</span>
                  <span className="text-green-600 font-medium">Active</span>
                </div>
              </div>
            </Card>

            {/* Danger Zone */}
            <Card className="p-6 border-red-200 bg-red-50">
              <h3 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-red-900 mb-2">Delete Account</h4>
                  <p className="text-sm text-red-700 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <ul className="text-xs text-red-600 mb-4 space-y-1">
                    <li>• All your budget plans will be deleted</li>
                    <li>• All categories and transactions will be removed</li>
                    <li>• All targets and goals will be lost</li>
                    <li>• Your account cannot be recovered</li>
                  </ul>
                  <Button
                    onClick={handleDeleteAccount}
                    variant="outline"
                    className="w-full text-red-700 border-red-300 hover:bg-red-100 hover:border-red-400"
                    disabled={isDeletingAccount}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete My Account
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Plan Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeletePlan}
        title="Delete Plan"
        message={`Are you sure you want to delete the plan "${planToDelete?.name}"? This action cannot be undone and will permanently remove all associated categories, transactions, and budget data.`}
        confirmText="Delete Plan"
        cancelText="Cancel"
        type="danger"
      />

      {/* Delete Account Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        onConfirm={confirmDeleteAccount}
        title="Delete Account Permanently"
        message="Are you absolutely sure you want to delete your account? This will permanently remove ALL your data including all budget plans, categories, transactions, targets, and personal information. This action is irreversible and your account cannot be recovered."
        confirmText={isDeletingAccount ? "Deleting..." : "Yes, Delete My Account"}
        cancelText="Cancel"
        type="danger"
        isLoading={isDeletingAccount}
      />
    </div>
  )
} 