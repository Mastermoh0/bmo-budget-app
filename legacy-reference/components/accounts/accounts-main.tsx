'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Plus, Edit3, Trash2, CreditCard, PiggyBank, Banknote, TrendingUp, Home, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { ErrorModal } from '@/components/ui/error-modal'
import { formatCurrency } from '@/lib/utils'
import { useUserRole } from '@/hooks/useUserRole'
import { AccountForm } from './account-form'

interface Account {
  id: string
  name: string
  type: string
  balance: number
  isOnBudget: boolean
  isClosed: boolean
  institution?: string
  accountNumber?: string
}

const accountTypeIcons = {
  CHECKING: CreditCard,
  SAVINGS: PiggyBank,
  CASH: Banknote,
  CREDIT_CARD: CreditCard,
  INVESTMENT: TrendingUp,
  MORTGAGE: Home,
  LOAN: DollarSign,
  OTHER_ASSET: DollarSign,
  OTHER_LIABILITY: DollarSign,
}

const accountTypeLabels = {
  CHECKING: 'Checking',
  SAVINGS: 'Savings',
  CASH: 'Cash',
  CREDIT_CARD: 'Credit Card',
  LINE_OF_CREDIT: 'Line of Credit',
  INVESTMENT: 'Investment',
  MORTGAGE: 'Mortgage',
  LOAN: 'Loan',
  OTHER_ASSET: 'Other Asset',
  OTHER_LIABILITY: 'Other Liability',
}

export function AccountsMain() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { canEdit, isViewer, userRole } = useUserRole()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  
  // Confirmation modal state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null)
  
  // Error modal state
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorModalConfig, setErrorModalConfig] = useState({
    title: '',
    message: '',
    details: '',
    type: 'error' as 'error' | 'warning' | 'info',
    actionButton: undefined as { text: string; onClick: () => void; variant?: 'default' | 'outline' } | undefined
  })

  // Get current plan ID from URL or localStorage
  const getCurrentPlanId = () => {
    const urlPlanId = searchParams.get('plan')
    if (urlPlanId) return urlPlanId
    
    // Fallback to localStorage
    return localStorage.getItem('lastSelectedPlan')
  }

  // Handle authentication/user errors by redirecting to sign-in
  const handleAuthError = async (error: string) => {
    console.log('Authentication error detected:', error)
    await signOut({
      callbackUrl: '/auth/signin',
      redirect: true
    })
  }

  // Helper function to show error modal
  const showError = (title: string, message: string, details?: string, actionButton?: { text: string; onClick: () => void; variant?: 'default' | 'outline' }) => {
    setErrorModalConfig({
      title,
      message, 
      details: details || '',
      type: 'error',
      actionButton
    })
    setShowErrorModal(true)
  }

  // Fetch accounts from API
  useEffect(() => {
    fetchAccounts()
  }, [searchParams]) // Re-fetch when URL parameters change

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const currentPlanId = getCurrentPlanId()
      const url = currentPlanId ? `/api/accounts?planId=${currentPlanId}` : '/api/accounts'
      
      console.log('🔍 AccountsMain: Fetching accounts for plan:', currentPlanId)
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setAccounts(data)
        console.log('✅ AccountsMain: Accounts loaded:', data.length, 'accounts')
      } else {
        const errorData = await response.json()
        
        // Check if it's an authentication/user error
        if (response.status === 401 || 
            errorData.error?.includes('not found in database') ||
            errorData.error?.includes('User not found') ||
            errorData.error?.includes('Unauthorized')) {
          await handleAuthError(errorData.error)
          return
        }
        
        console.error('Failed to fetch accounts:', errorData)
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddAccount = () => {
    setEditingAccount(null)
    setShowForm(true)
  }

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account)
    setShowForm(true)
  }

  const handleDeleteAccount = (accountId: string) => {
    setAccountToDelete(accountId)
    setShowDeleteConfirmation(true)
  }

  const confirmDeleteAccount = async () => {
    if (!accountToDelete) return

    try {
      // Get current plan ID and pass it to the API
      const currentPlanId = getCurrentPlanId()
      const url = currentPlanId 
        ? `/api/accounts/${accountToDelete}?planId=${currentPlanId}`
        : `/api/accounts/${accountToDelete}`
      
      console.log('🗑️ Deleting account from plan:', currentPlanId)
      
      const response = await fetch(url, {
        method: 'DELETE',
      })

      if (response.ok) {
        setAccounts(accounts.filter(account => account.id !== accountToDelete))
      } else {
        const errorData = await response.json()
        
        // Check if it's an authentication/user error
        if (response.status === 401 || 
            errorData.error?.includes('not found in database') ||
            errorData.error?.includes('User not found') ||
            errorData.error?.includes('Unauthorized')) {
          await handleAuthError(errorData.error)
          return
        }
        
        // Show more specific error message
        if (errorData.error?.includes('existing transactions')) {
          showError(
            'Cannot Delete Account',
            errorData.error,
            'You can close the account instead by editing it and checking "Closed Account".',
            {
              text: 'Edit Account',
              onClick: () => {
                const account = accounts.find(acc => acc.id === accountToDelete)
                if (account) {
                  handleEditAccount(account)
                }
              },
              variant: 'outline'
            }
          )
        } else {
          showError(
            'Delete Failed',
            errorData.error || 'Unable to delete the account. Please try again.'
          )
        }
      }
    } catch (error) {
      console.error('Failed to delete account:', error)
      showError(
        'Delete Failed',
        'Unable to delete the account. Please check your connection and try again.'
      )
    } finally {
      setAccountToDelete(null)
      setShowDeleteConfirmation(false)
    }
  }

  const handleSaveAccount = async (accountData: Partial<Account>) => {
    try {
      if (editingAccount) {
        // Update existing account
        const currentPlanId = getCurrentPlanId()
        const accountDataWithPlan = {
          ...accountData,
          planId: currentPlanId // Pass the current plan ID
        }
        
        console.log('✏️ Updating account in plan:', currentPlanId)
        
        const response = await fetch(`/api/accounts/${editingAccount.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(accountDataWithPlan),
        })

        if (response.ok) {
          const updatedAccount = await response.json()
          setAccounts(accounts.map(account => 
            account.id === editingAccount.id ? updatedAccount : account
          ))
        } else {
          const errorData = await response.json()
          
          // Check if it's an authentication/user error
          if (response.status === 401 || 
              errorData.error?.includes('not found in database') ||
              errorData.error?.includes('User not found') ||
              errorData.error?.includes('Unauthorized')) {
            await handleAuthError(errorData.error)
            return
          }
          
          showError(
            'Update Failed',
            'Unable to update the account. Please check your information and try again.'
          )
        }
      } else {
        // Create new account in the current plan
        const currentPlanId = getCurrentPlanId()
        console.log('🏦 Creating account in plan:', currentPlanId)
        const accountDataWithPlan = {
          ...accountData,
          planId: currentPlanId // Pass the current plan ID
        }
        
        const response = await fetch('/api/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(accountDataWithPlan),
        })

        if (response.ok) {
          const newAccount = await response.json()
          setAccounts([...accounts, newAccount])
        } else {
          const errorData = await response.json()
          
          // Check if it's an authentication/user error
          if (response.status === 401 || 
              errorData.error?.includes('not found in database') ||
              errorData.error?.includes('User not found') ||
              errorData.error?.includes('Unauthorized')) {
            await handleAuthError(errorData.error)
            return
          }
          
          showError(
            'Create Failed', 
            'Unable to create the account. Please check your information and try again.'
          )
        }
      }
      setShowForm(false)
      setEditingAccount(null)
    } catch (error) {
      console.error('Failed to save account:', error)
      showError(
        'Save Failed',
        'Unable to save the account. Please check your connection and try again.'
      )
    }
  }

  // Group accounts by type
  const budgetAccounts = accounts.filter(account => account.isOnBudget && !account.isClosed)
  const trackingAccounts = accounts.filter(account => !account.isOnBudget && !account.isClosed)
  const closedAccounts = accounts.filter(account => account.isClosed)

  // Define liability account types
  const liabilityTypes = ['CREDIT_CARD', 'LINE_OF_CREDIT', 'MORTGAGE', 'LOAN', 'OTHER_LIABILITY']

  // Calculate proper balances considering account types
  const totalBudgetBalance = budgetAccounts.reduce((sum, account) => {
    const balance = Number(account.balance) // Convert Prisma Decimal to JavaScript number
    if (liabilityTypes.includes(account.type)) {
      return sum - Math.abs(balance) // Subtract debt from net worth
    }
    return sum + balance
  }, 0)
  
  const totalTrackingBalance = trackingAccounts.reduce((sum, account) => {
    const balance = Number(account.balance) // Convert Prisma Decimal to JavaScript number
    if (liabilityTypes.includes(account.type)) {
      return sum - Math.abs(balance) // Subtract debt from net worth
    }
    return sum + balance
  }, 0)

  if (loading) {
    return (
      <div className="flex-1 bg-white overflow-auto flex items-center justify-center">
        <div className="text-gray-500">Loading accounts...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-white overflow-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
            <p className="text-gray-600">
              {isViewer ? 'View all accounts and balances' : 'Manage your bank accounts, credit cards, and investments'}
            </p>
          </div>
          {canEdit && (
            <Button onClick={handleAddAccount} className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Account</span>
            </Button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Account Summary */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="text-center">
                <p className="text-sm text-green-600 font-medium mb-1">Total Assets</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(accounts.filter(a => !liabilityTypes.includes(a.type)).reduce((sum, a) => sum + Math.abs(Number(a.balance)), 0))}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {accounts.filter(a => !liabilityTypes.includes(a.type)).length} accounts
                </p>
              </div>
            </Card>
            <Card className="p-4 bg-red-50 border-red-200">
              <div className="text-center">
                <p className="text-sm text-red-600 font-medium mb-1">Total Liabilities</p>
                <p className="text-2xl font-bold text-red-700">
                  {formatCurrency(accounts.filter(a => liabilityTypes.includes(a.type)).reduce((sum, a) => sum + Math.abs(Number(a.balance)), 0))}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {accounts.filter(a => liabilityTypes.includes(a.type)).length} accounts
                </p>
              </div>
            </Card>
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="text-center">
                <p className="text-sm text-blue-600 font-medium mb-1">Net Worth</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatCurrency(accounts.reduce((sum, a) => {
                    if (liabilityTypes.includes(a.type)) {
                      return sum - Math.abs(a.balance)
                    }
                    return sum + a.balance
                  }, 0))}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {accounts.length} total accounts
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-gray-200"></div>

        {/* Budget Accounts */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Budget Accounts</h2>
              <p className="text-sm text-gray-600">Accounts included in your budget</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(totalBudgetBalance)}
              </div>
              <div className="text-sm text-gray-500">
                {budgetAccounts.length} accounts
              </div>
            </div>
          </div>
          
          {budgetAccounts.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">
              <p>No budget accounts yet. Add your checking and savings accounts to get started.</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {budgetAccounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onEdit={() => handleEditAccount(account)}
                  onDelete={() => handleDeleteAccount(account.id)}
                  canEdit={canEdit}
                />
              ))}
            </div>
          )}
        </section>

        {/* Tracking Accounts */}
        {trackingAccounts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Tracking Accounts</h2>
                <p className="text-sm text-gray-600">Accounts for tracking outside your budget</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">
                  {formatCurrency(totalTrackingBalance)}
                </div>
                <div className="text-sm text-gray-500">
                  {trackingAccounts.length} accounts
                </div>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {trackingAccounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onEdit={() => handleEditAccount(account)}
                  onDelete={() => handleDeleteAccount(account.id)}
                  canEdit={canEdit}
                />
              ))}
            </div>
          </section>
        )}

        {/* Closed Accounts */}
        {closedAccounts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Closed Accounts</h2>
                <p className="text-sm text-gray-600">Accounts that are no longer active</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  {closedAccounts.length} accounts
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {closedAccounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onEdit={() => handleEditAccount(account)}
                  onDelete={() => handleDeleteAccount(account.id)}
                  isClosed
                  canEdit={canEdit}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Account Form Modal */}
      {showForm && (
        <AccountForm
          account={editingAccount}
          onSave={handleSaveAccount}
          onCancel={() => {
            setShowForm(false)
            setEditingAccount(null)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => {
          setShowDeleteConfirmation(false)
          setAccountToDelete(null)
        }}
        onConfirm={confirmDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete this account? This action cannot be undone and will permanently remove all transaction history and data associated with this account."
        confirmText="Delete Account"
        cancelText="Keep Account"
        type="danger"
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title={errorModalConfig.title}
        message={errorModalConfig.message}
        details={errorModalConfig.details}
        type={errorModalConfig.type}
        actionButton={errorModalConfig.actionButton}
      />
    </div>
  )
}

interface AccountCardProps {
  account: Account
  onEdit: () => void
  onDelete: () => void
  isClosed?: boolean
  canEdit?: boolean
}

function AccountCard({ account, onEdit, onDelete, isClosed = false, canEdit = true }: AccountCardProps) {
  const IconComponent = accountTypeIcons[account.type as keyof typeof accountTypeIcons] || DollarSign
  
  return (
    <Card className={`p-4 hover:shadow-md transition-shadow group ${isClosed ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <IconComponent className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{account.name}</h3>
            <p className="text-sm text-gray-500">
              {accountTypeLabels[account.type as keyof typeof accountTypeLabels]}
            </p>
            {account.institution && (
              <p className="text-xs text-gray-400">{account.institution}</p>
            )}
          </div>
        </div>
        
        {canEdit && (
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-8 w-8"
            >
              <Edit3 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <div className={`text-lg font-bold ${
          account.balance >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {formatCurrency(account.balance)}
        </div>
        
        <div className="flex items-center space-x-2 mt-2">
          {account.isOnBudget && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Budget
            </span>
          )}
          {!account.isOnBudget && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Tracking
            </span>
          )}
          {isClosed && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Closed
            </span>
          )}
        </div>
      </div>
    </Card>
  )
} 