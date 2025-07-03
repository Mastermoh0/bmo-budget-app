'use client'

import { useState } from 'react'
import { Save, Edit3, Calendar, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

interface GeneralSettingsProps {
  groupId: string
  groupName: string
  currentUserRole: 'OWNER' | 'EDITOR' | 'VIEWER'
}

export function GeneralSettings({ groupId, groupName, currentUserRole }: GeneralSettingsProps) {
  const [budgetName, setBudgetName] = useState(groupName)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const canEdit = currentUserRole === 'OWNER'

  const handleSave = async () => {
    if (!budgetName.trim()) {
      setError('Budget name is required')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: budgetName.trim()
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Budget name updated successfully')
        setIsEditing(false)
        // You might want to trigger a page refresh or update global state here
      } else {
        setError(data.error || 'Failed to update budget name')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setBudgetName(groupName)
    setIsEditing(false)
    setError('')
    setSuccess('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">General Settings</h3>
        <p className="text-sm text-gray-600">
          Manage basic settings for your budget.
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Budget Name */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-medium text-gray-900">Budget Name</h4>
            <p className="text-sm text-gray-600">The name of your shared budget</p>
          </div>
          {canEdit && !isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <Input
              value={budgetName}
              onChange={(e) => setBudgetName(e.target.value)}
              placeholder="Enter budget name"
              maxLength={50}
            />
            <div className="flex space-x-3">
              <Button
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-lg font-medium text-gray-900">
            {groupName}
          </div>
        )}
      </Card>

      {/* Budget Preferences */}
      <Card className="p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Budget Preferences</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Budget Period</p>
                <p className="text-sm text-gray-600">How often your budget resets</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Monthly
              <span className="ml-2 bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs">
                Coming Soon
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Currency</p>
                <p className="text-sm text-gray-600">Default currency for transactions</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              USD ($)
              <span className="ml-2 bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      {canEdit && (
        <Card className="p-6 border-red-200">
          <h4 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-red-900">Delete Budget</p>
                <p className="text-sm text-red-600">Permanently delete this budget and all its data</p>
              </div>
              <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                Delete Budget
                <span className="ml-2 bg-red-100 text-red-500 px-2 py-1 rounded-full text-xs">
                  Coming Soon
                </span>
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
} 