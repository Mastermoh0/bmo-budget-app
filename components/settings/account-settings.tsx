'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Plus, Edit3, Trash2, DollarSign, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'

interface Account {
  id: string
  name: string
  type: string
  balance: number
  createdAt: string
}

interface AccountSettingsProps {
  groupId: string
  currentUserRole: 'OWNER' | 'EDITOR' | 'VIEWER'
}

export function AccountSettings({ groupId, currentUserRole }: AccountSettingsProps) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form states
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [accountForm, setAccountForm] = useState({
    name: '',
    type: 'Checking',
    initialBalance: '0.00'
  })

  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null)

  const canEdit = currentUserRole !== 'VIEWER'

  useEffect(() => {
    fetchAccounts()
  }, [groupId])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts')
      if (response.ok) {
        const data = await response.json()
        setAccounts(data.accounts || [])
      } else {
        setError('Failed to load accounts')
      }
    } catch (error) {
      setError('Network error while loading accounts')
    } finally {
      setLoading(false)
    }
  }

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!accountForm.name.trim()) {
      setError('Account name is required')
      return
    }

    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: accountForm.name.trim(),
          type: accountForm.type,
          initialBalance: parseFloat(accountForm.initialBalance) || 0
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Account added successfully')
        setAccountForm({ name: '', type: 'Checking', initialBalance: '0.00' })
        setShowAddForm(false)
        fetchAccounts()
      } else {
        setError(data.error || 'Failed to add account')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    }
  }

  const handleDeleteAccount = (account: Account) => {
    setAccountToDelete(account)
    setShowDeleteModal(true)
  }

  const confirmDeleteAccount = async () => {
    if (!accountToDelete) return

    try {
      const response = await fetch(`/api/accounts/${accountToDelete.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setAccounts(accounts.filter(a => a.id !== accountToDelete.id))
        setSuccess(`${accountToDelete.name} has been deleted`)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete account')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setShowDeleteModal(false)
      setAccountToDelete(null)
    }
  }

  const getAccountIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'checking':
        return <Wallet className="w-5 h-5 text-blue-600" />
      case 'savings':
        return <DollarSign className="w-5 h-5 text-green-600" />
      case 'credit':
        return <CreditCard className="w-5 h-5 text-purple-600" />
      default:
        return <Wallet className="w-5 h-5 text-gray-600" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Management</h3>
          <p className="text-sm text-gray-600">
            Manage your budget accounts and their balances.
          </p>
        </div>
        {canEdit && (
          <Button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Account</span>
          </Button>
        )}
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

      {/* Add Account Form */}
      {showAddForm && canEdit && (
        <Card className="p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Add New Account</h4>
          <form onSubmit={handleAddAccount} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name
                </label>
                <Input
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  placeholder="e.g., Chase Checking"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type
                </label>
                <select
                  value={accountForm.type}
                  onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Checking">💰 Checking</option>
                  <option value="Savings">🏦 Savings</option>
                  <option value="Credit">💳 Credit Card</option>
                  <option value="Cash">💵 Cash</option>
                  <option value="Investment">📈 Investment</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Initial Balance
              </label>
              <Input
                type="number"
                step="0.01"
                value={accountForm.initialBalance}
                onChange={(e) => setAccountForm({ ...accountForm, initialBalance: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="flex space-x-3">
              <Button type="submit">
                Add Account
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false)
                  setAccountForm({ name: '', type: 'Checking', initialBalance: '0.00' })
                  setError('')
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Accounts List */}
      <Card className="p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Current Accounts ({accounts.length})</h4>
        
        {accounts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No accounts found</p>
            {canEdit && (
              <p className="text-sm mt-1">Add your first account to get started</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getAccountIcon(account.type)}
                  <div>
                    <p className="font-medium text-gray-900">{account.name}</p>
                    <p className="text-sm text-gray-600">{account.type}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className={`font-medium ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(account.balance)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Added {new Date(account.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {canEdit && (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingAccount(account)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAccount(account)}
                        className="text-red-600 hover:bg-red-50 hover:border-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Account Summary */}
      <Card className="p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Account Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Total Assets</p>
            <p className="text-xl font-bold text-green-700">
              {formatCurrency(accounts.filter(a => a.balance > 0).reduce((sum, a) => sum + a.balance, 0))}
            </p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-600 font-medium">Total Liabilities</p>
            <p className="text-xl font-bold text-red-700">
              {formatCurrency(Math.abs(accounts.filter(a => a.balance < 0).reduce((sum, a) => sum + a.balance, 0)))}
            </p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Net Worth</p>
            <p className="text-xl font-bold text-blue-700">
              {formatCurrency(accounts.reduce((sum, a) => sum + a.balance, 0))}
            </p>
          </div>
        </div>
      </Card>

      {/* Delete Account Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteAccount}
        title="Delete Account"
        message={`Are you sure you want to delete "${accountToDelete?.name}"? This action cannot be undone and all associated transactions will be affected.`}
        confirmText="Delete Account"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  )
}